# Chrome Pass

This repository contains a Chrome extension that integrates the
[pass](https://www.passwordstore.org/) password manager with Chrome.

There are two folders in this repository that contain:

  1. extension: This is the chrome extension (javascript) that is added to
     Chrome or Chromium browser.
  2. application: This is a [Chrome Native Application](https://developer.chrome.com/extensions/nativeMessaging#native-messaging-host-location)
     written in python that serves as communication host between the extension
     and password store.

To use the extension you need to install the extension in your chrome or
chromium browser and the python native application (chrome_pass).

## Requirements

 1. Chrome version 107 or newer.
 2. Python 3+.
 3. pip 23.0 or newer
 4. [pass](https://www.passwordstore.org/) cli tool.
 5. [pass-otp](https://github.com/tadfisher/pass-otp) (optional for TOTP MFA
    support).
 6. Running gpg-agent
 7. A pinentry program configured.

## Quick Installation

These instructions have been tested in Ubuntu 22.04 and later:

### Python native pass application install

    sudo apt-get install pass python3 python3-pip
    pip install --user chrome-pass==0.5.1
    chrome_pass install

### Chrome extension install

Get the extension from [Chrome Web Store](https://chrome.google.com/webstore/detail/chrome-pass-zx2c4/oblajhnjmknenodebpekmkliopipoolo).

## Password Store

To reduce the code complexity of this extension there are some assumptions
regarding how the password store is structured. In order for this extension to
be able to list and decrypt your passwords these assumptions must be followed:

### Password Store Location

This extension assumes the password store is located inside the
*.password-store* folder inside your home directory:

    $HOME/.password-store

In case you have the password store located somewhere else you may try using a
symbolic link to work around this limitation.

### Password Paths

This plugin assumes that the last two parts of each password path follows this structure:

    [Service URL]/[Username]

For example to keep some Gmail and Amazon accounts:

    Password Store
    ├── mail.google.com
    │   ├── me@gmailcom 
    │   ├── you@gmail.com
    │   └── we@gmail.com
    └── Amazon
         ├── www.amazon.com
         │   ├── me@gmail.com
         │   └── wife@icloud.com
         └── www.amazon.co.jp
              ├── me@gmail.com
              └── wife@icloud.com

Your paths can have as many parts as you want as long as the last two follow the
above structure. And the [Service URL] part must match the URL of the page you
are viewing because it is used to select the corresponding password from the
store.

### TOTP MFA Codes

If the pass file has configured [pass-otp](https://github.com/tadfisher/pass-otp),
then chrome-pass will generate the TOTP code and fill any numeric text inputs in
the form with it.

### AWS IAM Accounts

For IAM accounts we need not only the login user and password but also the
account 12 digit ID or alias. For these accounts, chrome-pass has some special
logic to be able to fill all information in the login page.

    Password Store
    ├── signin.aws.amazon.com
    │   ├── my_root@email.com 
    │   ├── my_other_root@gmail.com
    │   ├── 183413992345
    │   ├── 550312930456-username1
    │   ├── 550312930456-username2
    │   └── accountalias

1. The [Service URL] must be `signin.aws.amazon.com` that is the URL for login into
   the console.
2. For root accounts the [Account] can be the root account email used for login.
3. For IAM accounts the [Account] can be anything that uniquely identifies the
   credentials. For example the account 12-digit ID, or the account alias, or a
   combination of the account 12-digit ID and the IAM username.
4. For IAM accounts edit the password GPG file using `pass edit ...` and add two
   key/value pairs:
   - `username=[IAM username]`
   - `account=[12 digit AWS account id or alias]`

### Custom input fields

The chrome-pass extension looks for any key/value pairs in the pass gpg files
and fills any input field with ID equal to the `key` with the corresponding
`value`.

In addition if the `value` is set to the following placeholder values they are
replaced:

- `pass__user`: Replaced with the `[Username]` extracted from the last part of
  the pass path.
- `pass__password`: Replaced with the decrypted pass password.
- `pass__otpauth`: Replaced with the pass-otp code if available.

This allows chrome-pass to work with some non-standard login forms like the
[Apple Id](https://appleid.apple.com/sign-in) login form. This login page lacks
a form element and relies in javascript to work. Fortunatelly the username and
password input fields have well defined IDs that we can set in the chrome-pass
file to let it work:

```
# chrome-pass for Apple ID login from.
account_name_text_field=pass__user
password_text_field=pass__password
```

## Install from source

This is for developers only or people that want to see the source code before
trusting their passwords to some extension written by an unknown person.

Inside Chrome open the url chrome://extensions, check the *Developer mode* and
then load the path to the *extension* folder using the *Load unpacked extension*
button. After the extension is loaded into Chrome take note of the *extension
ID*.

Next we need to install the *chrome_pass* wrapper script and install the Native
Host Application manifest:

    cd application
    pip install --upgrade setuptools build --user
    python -m build
    pip install . --user
    chrome_pass install [extension ID]

## Usage

- Open any web page with a login form.
- Click the pass button in the Chrome tool bar.
- Click the username you want to fill into the login form from the list.
  - You may type a search term in the search box to filter the list of usernames.
- The form should be automatically filled with the username and corresponding password.

## Version 0.5.1 Notes

Replace `otpoauth` custom fields with `pass__otpauth` in you pass files. The
`otpoauth` custom field will be removed and won't work in future releases.

Native application and extension 0.5.1 are not compatible with previous version.
Ensure both are 0.5.1 for them to work properly.

## Version 0.5.0 Notes

The `nativePass` script has been renamed to `chrome_pass`.

Version 0.5.0 of chrome-pass uses setuptools instead of distutils to package and
install the native application. When installing you may get errors such as:

```
ERROR: Cannot uninstall 'chrome-pass'. It is a distutils installed project and
thus we cannot accurately determine which files belong to it which would lead
to only a partial uninstall.
```

In this situation is necessary to manually uninstall older versions of the package:

1. Remove `nativePass` script. Find it using `which nativePass`.
2. Find where site-packages are installed (e.g.
   /var/lib/python3.10/site-packages) and remove all `chrome_pass-0.X.0...`
   files and directories.

## Troubleshooting

If for some reason the extension is unable to get the list of usernames from
your password store the most probable reasons are:

- The password store is not located on the default path (~/.password-store). If
 it is not there you may be able to create a symlink so the extension is able
 to find the passwords.
- The native host application manifest is in the wrong location. This manifest
 tells Chrome where to find the native application used to retrieve the
 passwords and username list. This file is usually located at
 ~/.config/google-chrome/NativeMessagingHosts folder and MUST be named
 *com.piaotech.chrome.extension.pass.json*.
- The chrome_pass script has a helper method to generate the native host
 manifest *chrome_pass install [extension id]* so use it to generate the
 manifest. If you do not give it am [extension id] it will generate the
 manifest with the id of the extension from the chrome web store.
- Another possible issue is that the manifest contents does not match your
  system:
  - Ensure the *path* contains the absolute path to the location of the
    chrome_pass wrapper script.
  - Ensure the *allowed_origins* contains the URI with the exact extension ID
    installed in Chrome. To get the extension ID simply browse chrome:
    //extensions and look for the ID of the chrome-pass extension installed.

## Note about python-gnupg

It has been found that the chrome_pass application is unable to decrypt the gpg
passwords with some newer versions of python-gnupg. I can verify that the plugin
works without issues when using gnupg module version 0.3.9 found by default in
Ubuntu 16.04LTS.

See related issue for details at: [Github](https://github.com/hsanson/chrome-pass/issues/8).

## Note about MacOS

If the plugin works when you launch chrome from within a terminal, but does not
work when launched from Spotlight or any other launcher, then ensure the PATH
environment variable is correctly set by the launcher.

See related issue for details at: [Github](https://github.com/hsanson/chrome-pass/issues/13)
