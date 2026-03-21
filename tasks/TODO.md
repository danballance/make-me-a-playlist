# List of potential tasks still to do

- [] Property based testing - typescript
- [] Mutation testing - python
- [] Mutation testing - typescript
- [] Don't copy git into project with copier
- [] Add docker linting
- [] Extract shared lint/test tooling when a second template exists

# Linting rules to catch

- [] Protocols must have @runtime_checkable
- [] Protocol method definitions must use ellipsis ... as function body
- [] Standarsise Docker conventions - FROM images

# Questions

- Pydantic BaseModels, frozen=true by default?
- Simarlalry, default to tuples instead of lists when read only?
- General pattern: immutable where possible
- Prefer generic interfaces - i.e. return Iterable not list
- common convention for iterations?
  - enumerate
  - for x in list
  - for k, v in thing.items()
  - standardise variable names to? ie. what index shoild be called: i, idx, index

  MAKE SURE NONE OF THESE RULES CONFLICT WITH 
  wemake-python-styleguide"

