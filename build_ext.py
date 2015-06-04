#!/usr/bin/env python

import os, subprocess, zipfile, json, datetime, time
import git, dateutil.parser

# get current re

dirname = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'chrome_app')
os.chdir(dirname)

repo = git.Repo("..")
commit_count = len(list(repo.head.commit.iter_parents())) + 1

# I want to have another value so things generated from branches with the same commit count don't end up with the same ID
# I'm going somewhat arbitrarily with hours since Jan 1, 2015 when the script is run, because it's monotonically increasing
# and will fit in Google's 2**16 limit for version ints

hours = int((time.time() - time.mktime(dateutil.parser.parse('2015-01-01').timetuple())) / 3600)

manifest = json.load(open("manifest.json"))
version = "%s.%s.%s" % (manifest['version'], str(commit_count), str(hours))
manifest['version'] = version
manifest['version_name'] = "%s / %s@%s" % (version, repo.active_branch.name, repo.head.commit.hexsha)

zipname = "../build/hanuman-build-%s.zip" % version
subprocess.Popen(["zip", zipname, "-r", ".", "-x", "manifest.json"]).communicate()

# add the manifest
with zipfile.ZipFile(zipname, 'a') as zf:
    manifest_str = json.dumps(manifest, indent=2)
    # swap out localhost for the real domain
    manifest_str = manifest_str.replace("localhost:8003", "biofinder.herokuapp.com")
    zf.writestr('manifest.json', manifest_str)