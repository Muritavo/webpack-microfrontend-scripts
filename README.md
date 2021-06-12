# What is this project
This project aims to create and build scripts that are focused on compiling microfrontend applications.

# How it is structured
The project has the following directory patterns

- src: Where all the development sources are coded in
    - {framework}: Each script is focused on being used bound to a framework
        - scripts: The scripts to be provided by this application (mainly start & build)
        - test: An aplication to test each provided script (mainly start & build)
            - application: The source for the application that is being compiled for tests