This repository contains a Chrome extension that integrates the [pass](https://www.passwordstore.org/) password
manager with Chrome.

There are two folders in this repository that contain:

  1. extension: This is the chrome extension (javascript) that is added to Chrome or Chromium
  browser.
  2. application: This is a [Chrome Native
  Application](https://developer.chrome.com/extensions/nativeMessaging#native-messaging-host-location)
  written in python that serves as communication host between the extension and the password store.

To use the extension you need to install the extension in your chrome or chromium browser and the
python native application (nativePass).

# Requirements

 1. Chrome version 50 or later.
 2. Python 3.
 3. [pass](https://www.passwordstore.org/) cli tool.
 4. Running gpg-agent
 5. A pinentry program configured.

# Quick Installation

These instructions have been tested in Ubuntu 16.04 only:

## Python native pass application install

    sudo apt-get install pass python3 python3-pip
    pip3 install --user chrome-pass==0.1.7
    nativePass install

## Chrome extension install

Get the extension from [Chrome Web Store](https://chrome.google.com/webstore/detail/chrome-pass-zx2c4/oblajhnjmknenodebpekmkliopipoolo).

# Password Store

To reduce the code complexity of this extension there are some assumptions regarding how the password store is structured.
In order for this extension to be able to list and decrypt your passwords these assumptions must be followed:

## Password Store Location

This extension assumes the password store is located inside the *.password-store* folder inside your home directory:

    $HOME/.password-store

in the future I may have the time to make this configurable. In case you have the password
store located somewhere else you may try using a symbolic link to work around this
limitation.

## Password Paths

This plugin assumes that the last two parts of each password path follows this structure:

    [Service URL]/[Account]

For example to keep some Gmail and Amazon accounts:

```
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
```

Your paths can have as many parts as you want as long as the last two follow the above structure. And the [Service URL] part must match the URL of the page you are viewing because it is used to select the correspoding password from the store.

# Install from source

This is for developers only or people that want to see the source code before trusting their passwords to some
extension written by an unknown person.

Inside Chrome open the url chrome://extensions, check the *Developer mode* and then load the path to the
*extension* folder using the *Load unpacked extension* button. After the extension is loaded into Chrome
take note of the *extension ID*.

Next we need to install the *nativePass* wrapper script and install the Native Host Application manifest:

    cd application
    python3 setup.py install
    nativePass install [extension ID]

# Usage

 - Open any web page with a login form.
 - Click the pass button in the Chrome tool bar.
 - Click the username you want to fill into the login form from the list.
   - You may type a search term in the search box to filter the list of usernames.
 - The form should be automatically filled with the username and corresponding password.

# Troubleshooting

If for some reason the extension is unable to get the list of usernames from your password store the most probable reasons are:

 - The password store is not located on the default path (~/.password-store). If it is not there you may be able to create a symlink so the extension is able to find the passwords.
 - The native host application manifest is in the wrong location. This manifest tells Chrome where to find the native application used to retrieve the passwords and username list. This file is usually located at ~/.config/google-chrome/NativeMessagingHosts folder and MUST be named *com.piaotech.chrome.extension.pass.json*.
 - The nativePass script has a helper method to generate the native host manifest *nativePass install [extension id]* so use it to generate the manifest. If you do not give it am [extension id] it will generate the manifest with the id of the extension from the chrome web store.
 - Another possible issue is that the manifest contents does not match your system:
   - Ensure the *path* contains the absolute path to the location of the nativePass wrapper script.
   - Ensure the *allowed_origins* contains the URI with the exact extension ID installed in Chrome. To get the extension ID simply browse chrome://extensions and look for the ID of the chrome-pass extension installed.

