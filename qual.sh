#!/bin/sh
# Pass version as first argument - REQUIRED.
#VER="${1:-`git symbolic-ref -q --short HEAD || git describe --tags --exact-match`}"
VER=$1
getNPMVer () {
  sed -e 's/^"//' -e 's/"$//' <<<`npm pkg get version`
}
integrityExit () {
  echo "$1"
  echo "Aborting build to preserve build tag integrity with commits." && exit 1
}
GITBRANCH=`git symbolic-ref -q --short HEAD`
GITTAG=`git describe --tags --exact-match 2>/dev/null`
COMMIT=$(git rev-parse HEAD)
cd `git rev-parse --show-toplevel` # cd to repo root.
IMAGENAME=`basename $(pwd)`
if [ -f ./package.json ]; then
  NPMVER=`getNPMVer`
fi
echo "Build Tag: $VER"
echo "NPM-Ver:   $NPMVER"
echo "Branch:    $GITBRANCH"
echo "Git Tag:   $GITTAG"
echo Commit: $COMMIT
echo Image Name: $IMAGENAME
echo
# Ensure they've already updated their npm version to match what they want to tag the build with.
if [[ "$NPMVER" != "" && "$VER" != "$NPMVER" ]]; then
  integrityExit "The version in your npm package.json file does not match the build tag passed.
Please run the following command to update your package version and commit those changes before attempting to build:

    npm version -no-git-tag-version $VER
"
fi
# Ensure we're building from committed changes.
if `git diff-index --quiet HEAD --`; then
  echo "Active branch $GITBRANCH is clean. Continuing with checks..."
else
  integrityExit "Active branch $GITBRANCH is dirty. Please commit changes to associate with build."
fi
# Ensure we're tagging with a version and not a branch name.
if [ "$VER" = "$GITBRANCH" ]; then
   integrityExit "Not tagging commit $COMMIT on branch $GITBRANCH with tag $GITBRANCH. Please provide a versioning argument."
fi
# Ensure our version paramenter is not in conflict with an existing commit tag.
if [[ "$GITTAG" != "" && "$GITTAG" != "v$VER" ]]; then
  integrityExit "Not overwriting existing tag $GITTAG on commit $COMMIT with new tag $VER."
fi
# Ensure we're able to tag the commit with the version.
if [[ "$VER" = "$GITTAG" || "v$VER" = "$GITTAG" ]]; then
  echo "Commit $COMMIT is already tagged as $GITTAG."
else
  if `git tag $VER $COMMIT`; then
    echo "Tagged commit $COMMIT on branch $GITBRANCH with tag $VER."
  else
    integrityExit "Failed to tag commit $COMMIT on branch $GITBRANCH with tag $VER."
  fi
fi
echo "Proceeding with versioned builds..."
docker build -t registry.its.txstate.edu/$IMAGENAME .
docker tag registry.its.txstate.edu/$IMAGENAME registry.its.txstate.edu/$IMAGENAME:$VER
docker push registry.its.txstate.edu/$IMAGENAME
docker push registry.its.txstate.edu/$IMAGENAME:$VER
git push origin --tags
