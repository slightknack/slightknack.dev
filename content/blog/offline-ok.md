+++
title = "I'm offline, and that's OK"
date = 2025-01-22

[extra]
artbit = "5_globe.png"
+++

*Stop showing me spinners, show me what's loading.*

Recently, while on a trip between cities, we hit a patch of road without
good coverage. While on long trips, I enjoy reading books I have saved
on my phone. I have some books on my phone that exist as PDFs stored on
Google Drive.

Before the trip, I started reading a few books while online, and I know
they're downloaded. Even so, while trying to navigate the hierarchy
folders to reach said books, I was met by spinner after spinner.
Sometimes a spinner appeared because I was offline, and Drive was trying
to fetch the contents of the Drive over the network. Other times, the
spinner spun for a few seconds while loading the contents of the folder
from disk. The problem is that there is absolutely no way to tell the
difference between the two. I know I'm offline: stop showing me
spinners¹, tell me what's loading.

When a user is offline, experience should degrade gracefully. This does
not mean that the worse the connection is the worse the experience
becomes. Rather, the offline experience should be as thought out as the
online experience, despite the degraded connection. What differentiates
incredible UX from good UX is consistently meeting user expectations,
*especially* when things go wrong…

…"You are offline, the contents of this folder will load once back
online." Is as easy as a spinner, and much more informative.

…If data is cached locally, show that data, even if incomplete, and tell
me what's loading, or needs to load. Reassure me that it's on the
device, and it will load.

…Whenever there is not a bounded guarantee on how long something will
take to load (e.g. when reading anything from disk or over a network),
show some meaningful indication of progress. This includes updating the
UI non-destructively as data loads in (don't shift stuff around),
showing a loading bar with uniform progress, and informing the user what
work is being done in a humane manner.

…When loading data or performing an operation with non-uniform progress
(e.g. over a network), tell me why the work is progressing slowly or
quickly. For example, one could keep a persistent indicator next to a
loading bar telling me when my connection is poor, when it is fast, when
the connection has dropped and is being reestablished, and when a
connection could not be established at all.

Figuring out how to incorporate these elements into a modern UI is a
hard problem, but one that has already mostly been solved.

The biggest issue, most likely, is economical: justifying the added cost
of having offline support. This is a false dichotomy: by default, all
applications are offline, and a network connection enhances this default
behaviour. Offline support is not an addition, but a foundation: if your
app is architected to work well when offline, it will be more robust
when progressively enhanced with internet connectivity.

Building robust apps is important: users will not keep coming back to an
app that is broken, no matter how useful it is when it works. Users may
be offline at times. Don't make your app the point of a user's
frustration: an offline experience shouldn't be a broken one.

At the end of the day, whether one is "connected to the Internet" or not
is not a question with a binary answer. A connection may be perfectly
fine for texting, yet not hold up when said conversation moves to a
video call. A high-latency, yet high-throughput connection might work
great while streaming, but terribly while gaming online. What is being
offline but having a connection with extremely high latency and
extremely low throughput?

Internet connectivity depends on the state of the physical
infrastructure of the internet. This will never be something application
authors—not even Google—will have complete control over. Even if strong
connectivity is guaranteed, consider that users may want to use your app
offline. The default is no connectivity, enhanced by a network
connection. Applications that are built to be local-first are more
robust at an architectural level, and lend themselves to developing an
incredible user experience with greater ease.

I'm offline, and that's OK. And even if I'm not, stop showing me
spinners: show me what's loading.

—

1\. Spinners originally existed to show that an app was doing work in
the background, and that the UI hadn't frozen. In the era of
asynchronous UI updates and multithreaded code, the UI should never
freeze, especially not because of a network request. The spinner,
therefore, is a redundant artifact from a bygone era. Stop using
spinners.
