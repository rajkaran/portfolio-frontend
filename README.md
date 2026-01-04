# Portfolio + Stock Alert

## On UBUNTU get tree
- Run below command to list all the fodlers and files under a dirctory in the tree strcture similar to `tree /F` on windoes.
```bash
$ cd src
$ find . | sed -e "s/[^-][^\/]*\// |/g" -e "s/|\([^ ]\)/|-\1/"
```
