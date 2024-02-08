# Release

## Chrome Extension

1. Create extension zip `zip -r extension.zip extension`.
2. Go to [Chrome Developer Dashboard](https:
   //chrome.google.com/webstore/devconsole).
3. Login with developer account (hxxxx.sxxxx@gmail.com).
4. Go to the extension details -> build -> package -> Upload new package.
5. After uploading the extension.zip file edit the store listing description.
6. Press `submit for review` to publish.

## Native App

1. pip3 install --user twine
2. Configure pypi API token in ~/.pypirc file.
     https://pypi.org/help/#apitoken
3. Update the version string below.
4. Build package with `python3 setup.py sdist`
5. Upload package with `twine upload dist/*`
