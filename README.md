This repository contains a Chrome extension that integrates the [pass](https://www.passwordstore.org/) password
manager with Chrome.

# Requirements

 1. Chrome version 50 or later.
 2. Python 3.
 3. [pass](https://www.passwordstore.org/) cli tool.

# Quick Installation

These instructions have been tested in Ubuntu 16.04 only:

    sudo apt-get install pass python3 python3-pip
    pip3 install --user chrome-pass

Install the extension from [Chrome Web Store](https://chrome.google.com/webstore/detail/chrome-pass-zx2c4/oblajhnjmknenodebpekmkliopipoolo).


# Install from source

This is for developers only or people that want to see the source code before trusting their passwords to some
extension written by an unknown person.

First install the Chrome native application:

    cd application
    python3 setup.py install

this should install the *nativePass* native application tool and add a native application manifest into your
NativeMessagingHosts folder usually located in \$HOME/.config/google-chrome/NativeMessagingHosts.

Inside Chrome open the url chrome://extensions, check the *Developer mode* then load the path to the
*extension* folder using the *Load unpacked extension* button.

After this you should see the extension available and an icon in your Chrome toolbar.

# Usage

Open any web page that has a login form and press the *pass* icon in the toolbar. You should see a list of
available usernames from your password store ordered by similarity with the web page URL.

You can also filter the list by typing in the search box at the bottom.

When you click a username the extension will get the corresponding password and try to fill the username and
password in the login form.

# Limitations

 1. Assumes your password store is in the default location *\$HOME/.password-store*
 2. Assumes you use gpg-agent and that python is able to decrypt your password store without need to input
 a passphrase.
 3. Only works on Ubuntu/Debian linux. May work on OSX but it is not tested.

# Known Issues

If the extension shows an error message indicating that no communication is possible with the native application it is possible that the
pip installation of the native application wrapper did not go well. You may be able to fix this following these steps:

First find the absolute path to the nativePass script:

    which nativePass

if the above command does not return anything it means your pip3 tool is installing binary scripts in a path that is not part of your system
PATH. Try to find where the nativePass script is by other means such as *find* command tool.

Once you have the full path for the nativePass script (e.g. \$HOME/.local/bin/nativePass) try to locate and edit the native messaging host
manifest file. This is usually located at:

    $HOME/.config/google-chrome/NativeMessagingHosts/com.piaotech.chrome.extension.pass.json

Inside the file check that the *path* variable is set to the absolute path location of the nativePass script above.

Also it would be a good time to verify that the *allowed_origins* variable is set correctly. For this open the URL *chrome://extensions*
inside Chrome and look for the chrome-pass extension *ID*. It should look something like *oblajhnjmknenodebpekmkliopipoolo* and ensure it
matches the *allowed_origins* URI.

