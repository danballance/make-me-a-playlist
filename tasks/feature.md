# Make me a playlist app

## Project Goal

"Make Me A Playlist" is an app that takes a topic from a user and then uses an AI agent to discuss and clarify the topic with the user before launching a research process with a suite of specialised search APIs to locate a list of 5 unusual, personalised videos to recommend the user watch. 

## Feature Scope

The core agentic search functionality is already written and provided by the python `recommend` package, which is already installed. That package provides a library as well as a CLI which exemplifies it's usage. This project will use the library package - although the CLI might be a useful reference implementation.

## Bootstrap resources

This new feature work is supported by 3 resources:
- 1. Natural language feature documenation (this document)
- 2. HTML UI mock-ups
- 3. Gherkin feature descriptions

### HTML Mock-ups

In @tasks/research/mock-ups/ there are 3 html designs for the 3 screens needed by this feature:
1. topic-input.html
2. conversation.html
3. results.html

### Gherkin feature descriptions

In @tasks/research/feature-descriptions/ there is a gherkin .feature file for each of the 3 screens:
1. 01_topic_input.feature
2. 02_conversation.feature
3. 03_results.feature

These feature descriptions can be used with palywrght-bdd to create end-to-end tests for Playwright. There's a playwright-bdd skill that you should load when you are ready to do this work.

## Stack overview

This is a new fullstack app being booted from a template.
The template provides an opionated stack:
- Python back end using Litestar and Piccolo ORM for SQL database access (SQLite to start with)
- The front end client is a React app built with vite and using TanStack Router, TanStack Query, Zustand for client state and tailwind for CSS.

### Stack example code

The stack template ships with a basic to-do lis application, based on the Litestar example app and OpenAPI Schema.

This example code should be removed once the first feature in the project has been implemented. Until then it provides another form of documentation which can be used to answer questions about which patterns or idioms should be adopted.

## Development Methodology

Development is designed to progress sequentially through a number of stages:

1. planning
2. test creation
3. implementation
4. documentation

## Testing Strategy

- Python uses funtional-style pyest for unit testing
- The React front end is covered by BDD E2E tests using Playwright.

## Recommender documentation

There is a `recommender` skill available in this project. Please load that when you need to understgand how the package works. 
