"""
chrome_pass native application module
"""

import os
import re
import sys
import json
import struct
import shutil
import difflib
import pathlib
import posixpath
from urllib.parse import parse_qs
from urllib.parse import urlparse
from collections import OrderedDict
from importlib.metadata import entry_points
from importlib.metadata import version
import pyotp
import gnupg

if sys.platform == "win32":
    # Interacts with windows registry to register this app
    import winreg  # pylint: disable=import-error
    # On Windows, the default I/O mode is O_TEXT. Set this to O_BINARY
    # to avoid unwanted modifications of the input/output streams.
    import msvcrt  # pylint: disable=import-error
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)

EXTENSION_NAME = "com.piaotech.chrome.extension.pass"
EXTENSION_ID = "oblajhnjmknenodebpekmkliopipoolo"


def get_gpg_bin():
    if 'PASS_GPG_BIN' in os.environ:
        return os.environ['PASS_GPG_BIN']
    if shutil.which('gpg2'):
        return shutil.which('gpg2')
    return shutil.which('gpg')


def get_store_path():
    if 'PASSWORD_STORE_DIR' in os.environ:
        path = os.environ['PASSWORD_STORE_DIR']
    else:
        path = os.path.expanduser('~') + "/.password-store"
    return path


# Returns a similarity score between two strings.
def similarity(pattern1, pattern2):
    return difflib.SequenceMatcher(a=pattern1.lower(),
                                   b=pattern2.lower()).ratio()


# Returns the similarity score of a credential to a pattern. This method is
# used as sort key for sorting the credential list based on similarity to the
# search pattern.
def sort_key(credential):
    score = similarity(credential[1], credential[3])
    return score


# Returns a list of credentials ordered by similarity to the pattern argument.
# The list is a list of lists with the format:
#
#  [
#    [ "store path", "url", "username", "pattern" ],
#    [ "store path", "url", "username", "pattern" ],
#    [ "store path", "url", "username", "pattern" ],
#    .....
#  ]
def get_list(pattern):
    credentials = []
    for root, _, files in os.walk(get_store_path(), followlinks=True):
        if len(files) > 0:
            for f in files:
                if f.endswith(".gpg"):
                    cred_path = root.replace(get_store_path(), "")
                    cred_url = get_url(cred_path)
                    cred_user = f.replace(".gpg", "")
                    credentials.append(
                        [cred_path, cred_url, cred_user, pattern])

    return sorted(credentials, key=sort_key, reverse=True)


def get_url(path):
    return os.path.basename(os.path.normpath(path))


# Decrypt and read pass file data.
def read_data(path):
    with open(get_store_path() + "/" + path + ".gpg", "rb") as txt:
        gpg = gnupg.GPG(use_agent=True, gpgbinary=get_gpg_bin())
        decrypted = gpg.decrypt_file(txt)
        if decrypted.ok:
            return decrypted.data

    raise RuntimeError(f'Failed to decrypt {txt}')


def get_creds(path):
    """
    Returns a dictionary with id and value pairs read from pass files
    that match pattern:

      key=value

    key only matches alphanumeric characters and cannot have spaces.
    """

    # Read decripted pass file data.
    data = read_data(path).decode('utf-8').split("\n")

    # Filter creds
    reg = re.compile(r'^\w*=.*$')
    filtered = list(filter(reg.search, data))

    # Convert to dictionary
    creds = dict(s.split("=") for s in filtered)

    # Add default username and password.
    # Use non-standard key names to avoid conflicts with page DOM ids.
    creds["pass__user"] = pathlib.PurePath(path).name
    creds["pass__password"] = data[0]

    # Extract OTPT secret if any
    reg = re.compile(r'^otpauth://totp/.*$')
    otpt = list(filter(reg.search, data))

    if len(otpt) > 0:
        secret = parse_qs(urlparse(otpt[0]).query)["secret"][0]
        code = pyotp.TOTP(secret).now()
        creds["pass__otpauth"] = code

    return creds


def send_message(message):
    """
    Sends response messages in format compatible with chrome
    HostNativeApplications.
    """
    response = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('I', len(response)))
    sys.stdout.buffer.write(response)
    sys.stdout.buffer.flush()


def process_native():
    """
    Method that implements Chrome Native App protocol to enable
    communication between chrome-pass chrome extension and pass.
    """
    size = sys.stdin.buffer.read(4)

    if not size:
        send_message({"action": "native-app-error", "msg": "no data"})
        sys.exit()

    try:
        length = struct.unpack('I', size)[0]
        data = sys.stdin.buffer.read(length)
        request = json.loads(data.decode('utf-8'))
        action = request["action"]
        if action == "get-list":
            pattern = urlparse(request["url"]).netloc
            send_message({
                "action": "fill-list",
                "credentials": get_list(pattern),
                "url": pattern
            })
        elif action == "get-creds":
            path = request["path"]
            creds = get_creds(path)
            send_message({
                "action": "fill-creds",
                "creds": creds
            })
    except RuntimeError as e:
        send_message({"action": "native-app-error", "msg": str(e)})
    except Exception:
        send_message({"action": "native-app-error", "msg": sys.exc_info()[0]})


def print_list(pattern):
    """
    Method prints to stdout the list of passwords ordered by a similarty
    pattern
    """
    for credential in get_list(pattern)[:20]:
        print(credential)


def print_creds(pattern):
    """
    Method prints to stdout the first match creds data.
    """
    for credential in get_list(pattern)[:20]:
        account = credential[0] + "/" + credential[2]
        print(f'{get_creds(account)}')


def native_path_chrome():
    """
    Determines the path were the native app manifest should be installed.
    """
    if sys.platform == "darwin":
        return os.path.expanduser(
            '~'
        ) + "/Library/Application Support/Google/Chrome/NativeMessagingHosts/"
    if sys.platform in ("linux", "linux2"):
        return os.path.expanduser(
            '~') + "/.config/google-chrome/NativeMessagingHosts/"
    if sys.platform == "win32":
        return os.path.join("Google", "Chrome", "NativeMessagingHosts",
                            EXTENSION_NAME)

    sys.stderr.write("Only linux, OSX or Windows are supported")
    sys.exit(1)


def native_path_chromium():
    if sys.platform == "darwin":
        return os.path.expanduser(
            '~'
        ) + "/Library/Application Support/Chromium/NativeMessagingHosts/"
    if sys.platform in ("linux", "linux2"):
        return os.path.expanduser(
            '~') + "/.config/chromium/NativeMessagingHosts/"
    if sys.platform == "win32":
        return os.path.expanduser(
            '~') + "/AppData/Roaming/Chromium/NativeMessagingHosts/"

    sys.stderr.write("Only linux or OSX are supported")
    sys.exit(1)


def native_path_brave():
    if sys.platform in ("linux", "linux2"):
        return os.path.expanduser(
           '~') + "/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts/"

    sys.stderr.write("Only linux is supported, patches welcome!!.")
    sys.exit(1)


def find_chrome_pass_path():
    """
    Convoluted function to figure out the absolute path of the chrome_pass
    console script.
    """
    entries = list(entry_points().select(
            name='chrome_pass', group='console_scripts'))

    if len(entries) <= 0:
        return ""

    package_path = list(filter(
        lambda file: file.name == "chrome_pass",
        entries[0].dist.files))

    if len(package_path) <= 0:
        return ""

    return posixpath.abspath(package_path[0].locate())


def install(native_path, extension_id):
    """
    Installs the Native Host Application manifest for this script into Chrome.
    """
    if sys.platform == "win32":
        # Appends APPDATA to native_path and set this path as a registry value
        reg_key = os.path.join("Software", native_path)
        native_path = os.path.join(os.environ['APPDATA'], native_path)
        outfile = os.path.join(native_path, EXTENSION_NAME + '.json')
        winreg.SetValue(winreg.HKEY_CURRENT_USER, reg_key, winreg.REG_SZ,
                        outfile)

    if not os.path.exists(native_path):
        os.makedirs(native_path)

    if sys.platform == "win32":
        batch = f"python \"{os.path.realpath(__file__)}\" %*"
        native_app = EXTENSION_NAME + '.bat'
        outfile = os.path.join(native_path, native_app)
        with open(outfile, 'w', encoding="utf-8") as file:
            file.write("@echo off\n\n")
            file.write(batch)
    else:
        native_app = find_chrome_pass_path()

    manifest = OrderedDict()
    manifest['name'] = EXTENSION_NAME
    manifest["description"] = "Chrome native host application for pass."
    manifest["path"] = native_app
    manifest["type"] = "stdio"
    manifest["allowed_origins"] = ["chrome-extension://" + extension_id + "/"]

    outfile = os.path.join(native_path, manifest['name'] + '.json')

    with open(outfile, 'w', encoding="utf-8") as file:
        json.dump(manifest, file, indent='\t')


def run():
    if len(sys.argv) > 1:
        if sys.argv[1].startswith('chrome-extension://'):
            process_native()
        elif sys.argv[1] == "version":
            print(f"Version: {version('chrome_pass')}")
        elif sys.argv[1] == "install":
            if len(sys.argv) > 2:
                install(native_path_chrome(), sys.argv[2])
                install(native_path_chromium(), sys.argv[2])
                install(native_path_brave(), sys.argv[2])
            else:
                install(native_path_chrome(), EXTENSION_ID)
                install(native_path_chromium(), EXTENSION_ID)
                install(native_path_brave(), EXTENSION_ID)
        elif sys.argv[1] == "pass":
            if len(sys.argv) > 2:
                print_creds(sys.argv[2])
        elif sys.argv[1] == "gpgbin":
            print(f"GPG Binary path: {get_gpg_bin()}")
        else:
            print_list(sys.argv[1])
