This repository contains a Chrome extension that integrates the [pass](https://www.passwordstore.org/) password
manager with Chrome.

# Requirements

 1. Chrome version 50 or later.
 2. Python 3.
 3. [pass](https://www.passwordstore.org/) cli tool.

# Quick Installation

These instructions have been tested in Ubuntu 16.04 only:

    sudo apt-get install pass python3 python3-pip
    pip3 install --user chrome-pass==0.1.5
    nativePass install

Install the extension from [Chrome Web Store](https://chrome.google.com/webstore/detail/chrome-pass-zx2c4/oblajhnjmknenodebpekmkliopipoolo).

# Install from source

This is for developers only or people that want to see the source code before trusting their passwords to some
extension written by an unknown person.

Inside Chrome open the url chrome://extensions, check the *Developer mode* and then load the path to the
*extension* folder using the *Load unpacked extension* button. After the extension is loaded into Chrome
take note of the extension ID.

Next we need to install the *nativePass* wrapper script and install the Native Host Application manifest:

    cd application
    python3 setup.py install
    nativePass install [extension ID]

# Usage

 - Open any web page with a login form.
 - Click the pass button in the Chrome toolbar.
 - Click the username you want to fill into the login form from the list.
   - You may type a search term in the search box to filter the list of usernames.
 - The form should be automatically filled with the username and corresponding password.

# Limitations

 1. Assumes your password store is in the default location *~/.password-store* and there is no way to change this currently.
 2. Only works on Ubuntu/Debian linux. May work on OSX but it is not tested.

# Troubleshooting

If for some reason the extension is unable to get the list of usernames from your password store the most probable reasons are:

 - The password store is not located on the default path (~/.password-store). If it is not there you may be able to create a
   symlink so the extension is able to find the passwords.
 - The native host application manifest is in the wrong location. This manifest tells Chrome where to find the native application used
   to retrieve the passwords and username list. This file is usually located at ~/.config/google-chrome/NativeMessagingHosts folder and
   MUST be named *com.piaotech.chrome.extension.pass.json*.
 - Another possible issue is that the manifest contents does not match your system:
   - Ensure the *path* contains the absolute path to the location of the nativePass wrapper script.
   - Ensure the *allowed_origins* contains the URI with the exact extension ID installed in Chrome. To get the extension ID simply
     open chrome://extensions page inside Chrome and look for the ID of the chrome-pass extension installed.
   - The nativePass script has a helper method to generate the native host manifest *nativePass install [extension id]* so use it
     to generate the manifest. If you do not give it am [extension id] it will generate the manifest with the id of the extension
     from the chrome web store.

