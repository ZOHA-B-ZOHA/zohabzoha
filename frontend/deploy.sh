set -e

yarn build

cd dist

git init
git add -A
git commit -m "deploy"

git push -f https://github.com/ZOHA-B-ZOHA/frontend-mobile.git master:gh-pages
