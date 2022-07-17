import os
from requests import get


banner = """
                 ██████╗███╗   ███╗███████╗██████╗
                ██╔════╝████╗ ████║██╔════╝██╔══██╗
                ██║     ██╔████╔██║███████╗██║  ██║
                ██║     ██║╚██╔╝██║╚════██║██║  ██║
                ╚██████╗██║ ╚═╝ ██║███████║██████╔╝

                                                    """
# Absolute path to the project
project_path = "/home/max/Documents/awt-pj-ss22-streaming-analytics-using-cmcd-and-cmsd-1/"
#project_path = "/home/master/awt-pj-ss22-streaming-analytics-using-cmcd-and-cmsd-1/"

# nginx commands
run_server = "sudo nginx -c" + project_path + "CMSD-DASH/server/nginx/config/nginx.conf"
reload_server = run_server + " -s reload"
restart_server = "sudo service nginx restart"
stop_server = "sudo killall nginx"
get_nginx_status = "sudo systemctl status nginx"
reset_active_sessions_1 = "curl http://localhost:8080/resetSessions"
reset_active_sessions_2 = "curl http://localhost:8090/resetSessions"

run_monitor = "python3 monitor.py"


def run_command(command: str):
    print("Run the following command: " + command + " ...\n")
    os.system(command)
    print("\n---------------------\n")


def start():
    os.system("clear")
    print(banner)
    print(">>> TU Berlin - Advanced Web Technologies Project <<<\n")
    print(">>> awt-pj-ss22-streaming-analytics-using-cmcd-and-cmsd-1 <<<\n")
    print(">>> This is a simple command line interface to simulate the behavior of servers <<<\n")


def print_options():
    print(">>> Options")
    print("1) Start servers")
    print("2) Reload server config")
    print("3) Restart servers")
    print("4) Stop all servers")
    print("5) Get nginx status")
    print("6) Choose server")
    print("7) Clear screen")
    print("8) Start monitor")


def choose_a_server(max_choice: int):
    while (True):
        print("")
        print("Available servers:")
        print("1) Server 1")
        print("2) Server 2")
        print("")
        user_input = input("Choose a server: ")
        print("")
        if 0 < int(user_input) <= max_choice:
            return int(user_input)
        if user_input == "cancel":
            print("As you wish.")
            exit()
        print("This was sadly not an option.")
        print_options()


def print_server_options():
    print("1) Get current server load")
    print("2) Get number of connected clients")
    print("3) Go back")


def get_user_choice(max_choice: int):
    while (True):
        print("")
        user_input = input("What do you want to do? ")
        print("")
        if 0 < int(user_input) <= max_choice:
            return int(user_input)
        print("This was sadly not an option.")
        print_options()


def get_server_load(server: str):
    if server == "1":
        command = "curl http://localhost:8080/getServerLoad"
        os.system(command)
        print("---------------------\n")
    elif server == "2":
        command = "curl http://localhost:8090/getServerLoad"
        os.system(command)
        print("---------------------\n")


def get_num_clients(server: str):
    if server == "1":
        command = "curl http://localhost:8080/getClients"
        os.system(command)
        print("---------------------\n")
    elif server == "2":
        command = "curl http://localhost:8090/getClients"
        os.system(command)
        print("---------------------\n")


def main():
    start()

    while(True):
        print_options()
        uc = get_user_choice(8)
        if uc == 1:
            run_command(run_server)
        if uc == 2:
            run_command(reload_server)
            run_command(reset_active_sessions_1)
            run_command(reset_active_sessions_2)
            # maybe also kill all chrome
        if uc == 3:
            run_command(restart_server)
        if uc == 4:
            run_command(stop_server)
        if uc == 5:
            run_command(get_nginx_status)
        if uc == 6:
            sc = choose_a_server(2)
            server = ""
            if sc == 1:
                server = "1"
            elif sc == 2:
                server = "2"
            while(True):
                print_server_options()
                uc = get_user_choice(3)
                if uc == 1:
                    get_server_load(server)
                elif uc == 2:
                    get_num_clients(server)
                elif uc == 3:
                    main()
        if uc == 7:
            main()
        if uc == 8:
            run_command(run_monitor)



if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nBye!")