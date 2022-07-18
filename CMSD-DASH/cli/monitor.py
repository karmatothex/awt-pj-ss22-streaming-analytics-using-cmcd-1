from __future__ import print_function, unicode_literals
import os
import json
import time

from tabulate import tabulate
import requests
#from PyInquirer import prompt, Separator

server1_port = 8080
server2_port = 8090


def load_color(load: int, overloaded) -> str:
    if load  < 60 and overloaded != "true":
        return f"\033[92m {load} \033[0m"
    else:
        return f"\033[91m {load}   \033[0m"

def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')

def query_servers():
    r1 = requests.get(f"http://localhost:{server1_port}/getServerInfo")
    r2 = requests.get(f"http://localhost:{server2_port}/getServerInfo")
    if r1.status_code != 200:
        print("Server-1 is broken")
        return
    if r2.status_code != 200:
         print("Server-2 is broken")
         return
    data1 = r1.json()
    data2 = r2.json()
    res = []

    res.append(["identifier", data1["identifier"], data2["identifier"]])
    res.append(["current_load", load_color(int(data1["current_load"]), data1["overload"]), load_color(int(data2["current_load"]), data2["overload"])])
    if "maxBitrate" in data1 and "maxBitrate" in data2:
        res.append(["bitrateLimit", data1["maxBitrate"], data2["maxBitrate"]])
    else:
        res.append(["bitrateLimit", "x", "x"])

    list1 = data1["activeSessions"]
    list2 = data2["activeSessions"]
    res.append(["active_sessions", len(list1), len(list2)])

    max_len = len(list1) if len(list1) > len(list2) else len(list2)

    for i in range(max_len):
        print(i)
        v1 = list1[i] if i < len(list1) else ""
        v2 = list2[i] if i < len(list2) else ""
        res.append([f"session_{i+1}", v1, v2 ])

    return tabulate(res, tablefmt="grid")


def main():
    delay = 1
    location = False

    while True:
        table = query_servers()
        clear_console()
        print("\033[92m Server Status\033[0m")
        print(table)
        time.sleep(delay)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\r  ")
        print("Leaving monitor, bye!")