# awt-pj-ss22-streaming-analytics-using-cmcd-1
Video streaming analytics enable content providers to analyze how video players behave and identify problems on certain platforms or devices.  

The Common-Media-Client-Data (CMCD) standard defines the format and the types of metrics send from a client to a metric server and database. A user interface build on top of the collected data helps evaluating and structuring the massive amount of information.  

Common-Media-Server-Data (CMSD) - not published yet - enables server-side (CDN/origin) communication to the clients. Early implementations are available for experimentation.

Use Cases:
- Player metrics and behavior for CDNs
- CDN caching optimizations
- Multi-CDN Switching
- Bitrate Assignment


Tasks:
- Understand standards: MPEG-DASH, CMCD and CMSD
- Use the CMCD implementation in dash.js
- Prototype CMSD endpoints in dash.js
- Experiment with CMSD implementations and use cases
- Implement a backend to receive and persist metrics (in a database) with a software stack of your
choice
- Build an analytics UI with access to the database, e.g. using Grafana
