import sys
import os
import json
from distutils.core import setup
from collections import OrderedDict
from distutils.command.install import install

if sys.version_info[0] < 3:
  sys.stderr.write('Only Python 3 supported\n')
  sys.exit(1)

class install_native_app(install):

    def run(self):

      super().run()

      nativePath = ""

      if sys.platform == "darwin":
        nativePath = os.environ['HOME'] + "/Library/Application Support/Google/Chrome/NativeMessagingHosts/" 
      elif sys.platform == "linux" or sys.platform == "linux2":
        nativePath = os.environ['HOME'] + "/.config/google-chrome/NativeMessagingHosts/"
      else:
        sys.stderr.write("Only linux or OSX are supported")
        sys.exit(1)

      manifest = OrderedDict()
      manifest['name'] = "com.piaotech.chrome.extension.pass"
      manifest["description"] = self.distribution.metadata.description
      manifest["path"] = self.distribution.get_command_obj('install_scripts').get_outputs()[0]
      manifest["type"] = "stdio"
      manifest["allowed_origins"] = ["chrome-extension://oblajhnjmknenodebpekmkliopipoolo/"]

      if not os.path.exists(nativePath):
        os.makedirs(nativePath)

      outfile = os.path.join(nativePath, manifest['name'] + '.json')

      with open(outfile, 'w') as file:
        json.dump(manifest, file, indent='\t')

cmdclass = {}
cmdclass['install'] = install_native_app

setup(
  name="chrome-pass",
  version="0.1.1",
  description="Chrome Native application for pass - the standard Unix password manager",
  url="https://github.com/hsanson/chrome-pass",
  author="Horacio Sanson",
  license="MIT",
  install_requires=['python-gnupg'],
  scripts=["nativePass"],
  cmdclass=cmdclass
  )
