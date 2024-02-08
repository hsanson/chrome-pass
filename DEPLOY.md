# Release

## Chrome Extension

1. Create extension zip `zip -r extension.zip extension`.
2. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Login with developer account (hxxxx.sxxxx@gmail.com).
4. Go to the extension details -> build -> package -> Upload new package.
5. After uploading the extension.zip file edit the store listing description.
6. Press `submit for review` to publish.

## Native App

1. Configure pypi API token in ~/.pypirc file.
     https://pypi.org/help/#apitoken
2. cd application
3. pip3 install --user twine build setuptools
4. Update the version string in the pyproject.toml file.
5. Build package with `python3 -m build`
6. Upload package with `twine upload dist/*`
