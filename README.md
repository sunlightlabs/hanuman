# Hanuman

The Invisible Influencers project focuses on finding information about people who fit the common-sense but not statutory definition of "lobbyist," mainly by extracting information from the text of the staff biographies of such people posted on the websites of their employers. This repository houses various bits related to the retrieval of lobbyist bios:

* `chrome_app` contains a Chrome app that presents users with an interface for annotating lobbying firm websites to indicate which pages are bio pages, and which parts of the page are the person's name and bio text.
* `data_collection` contains the Django app with which the Chrome app communicates
* `extraction` contains another Django app that generalizes based on the user input collected with the Chrome app, using machine learning to find more bio pages on a given firm's site based on a hand-collected sample, and to extract the content (names, bios) from those pages. This component depends on the [nanospider](https://github.com/sunlightlabs/nanospider) repo for spidering, and the [mlscrape](https://github.com/sunlightlabs/mlscrape) repo for building machine learning models to recognize pages and relevant content.