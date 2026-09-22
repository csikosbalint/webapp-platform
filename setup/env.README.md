# Check
- check GH tool
- check VERCEL tool

# GH
- clone repo template
- integrate GH npm registry with GH repo (core)
    - create GH NPM_TOKEN (read/write)
    - GH action should build npm package
    - GH action should push npm package to GH npm registry
    - get GH NPM_TOKEN  
- integrate GH repo with VERCEL deployment (plugins/ui - NextJS app)
    - provide GH NPM_TOKEN as env. var for build
