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

# monitor command
run_monitor = "python3 monitor.py"

# dash-js command
launch_dash_js = "cd " + project_path + "/CMSD-DASH/dash.js/ && grunt dev"

# log commands
access_log = "tail -f /var/log/nginx/access.log"
error_log = "tail -f /var/log/nginx/error.log"
server_1_log = "tail -f " + project_path + "/CMSD-DASH/server/logs/cmsd.log"
server_2_log = "tail -f " + project_path + "/CMSD-DASH/server/logs/cmsd2.log"

# run clients command
run_clients = "cd " + project_path + "/CMSD-DASH/dash-test && sudo bash batch_test.sh" 


def run_command(command: str):
    print("Run the following command: " + command + " ...\n")
    os.system(command)
    print("\n---------------------\n")


def start():
    os.system("clear")
    print(banner)
    print(">>> TU Berlin - Advanced Web Technologies Project <<<\n")
    print(">>> awt-pj-ss22-streaming-analytics-using-cmcd-and-cmsd-1 <<<\n")


def print_options():
    print(">>> Options")
    print(" 1) Start servers")
    print(" 2) Launch dash-js")
    print(" 3) Run multiple clients")
    print(" 4) Reload server config")
    print(" 5) Restart servers")
    print(" 6) Stop all servers")
    print(" 7) Get nginx status")
    print(" 8) Choose server")
    print(" 9) Start monitor")
    print("10) Watch logs")
    print("11) Clear screen")


def print_servers():
    print("")
    print("Available servers:")
    print("1) Server 1")
    print("2) Server 2")
    print("")


def print_logfiles():
    print("")
    print("Available logfiles:")
    print("1) Nginx access.log")
    print("2) Nginx error.log")
    print("3) Server 1 logs")
    print("4) Server 2 logs")
    print("5) Go back")
    print("")


def print_server_options():
    print("1) Get current server load")
    print("2) Get number of connected clients")
    print("3) Get (manual) overload")
    print("4) Set (manual) overload")
    print("5) Go back")


def choose_a_server(max_choice: int):
    while(True):
        print_servers()
        user_input = input("Choose a server: ")
        print("")
        try:
            if 0 < int(user_input) <= max_choice:
                return int(user_input)
            else:
                print("This was sadly not an option, try again.")
                print("To call a function, simply enter the corresponding number.\n")
        except ValueError:
            print("This was sadly not an option.")
            print("To call a function, simply enter the corresponding number.\n")


def get_user_choice(max_choice: int):
    while (True):
        print("")
        user_input = input("What do you want to do? ")
        print("")
        try:
            if 0 < int(user_input) <= max_choice:
                return int(user_input)
            else:
                print("This was sadly not an option, try again.")
                print("To call a function, simply enter the corresponding number.\n")
                return
        except ValueError:
            print("This was sadly not an option, try again.")
            print("To call a function, simply enter the corresponding number.\n")
            return


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


def get_overload(server: str):
    if server == "1":
        command = "curl http://localhost:8080/getOverload"
        os.system(command)
        print("---------------------\n")
    elif server == "2":
        command = "curl http://localhost:8090/getOverload"
        os.system(command)
        print("---------------------\n")


def set_overload(server: str, overload: str):
    if server == "1":
        command = "curl --header \"overload: " + overload + "\" http://localhost:8080/setOverload"
        os.system(command)
        print("---------------------\n")
    elif server == "2":
        command = "curl --header \"overload: " + overload + "\" http://localhost:8090/setOverload"
        os.system(command)
        print("---------------------\n")


def set_new_overload(server: str):
    while (True):
        print("---------------------\n")
        user_input = input("Set overload? (true/false): ")
        print("---------------------\n")
        if (user_input == "true") | (user_input == "false"):
            set_overload(server, user_input)
            return
        else:
            print("This was sadly not an option, try again.\n")

def main():
    start()

    while(True):
        print_options()
        uc = get_user_choice(11)
        if uc == 1:
            run_command(run_server)
        if uc == 2:
            run_command(launch_dash_js)
        if uc == 3:
            os.system("clear")
            run_command(run_clients)
        if uc == 4:
            run_command(reload_server)
            run_command(reset_active_sessions_1)
            run_command(reset_active_sessions_2)
            # run_command("sudo killall chrome") 
        if uc == 5:
            run_command(restart_server)
        if uc == 6:
            run_command(stop_server)
        if uc == 7:
            run_command(get_nginx_status)
        if uc == 8:
            sc = choose_a_server(2)
            while(True):
                print_server_options()
                uc = get_user_choice(5)
                if uc == 1:
                    get_server_load(str(sc))
                elif uc == 2:
                    get_num_clients(str(sc))
                elif uc == 3:
                    get_overload(str(sc))
                elif uc == 4:
                    set_new_overload(str(sc))
                elif uc == 5:
                    main()
        if uc == 9:
            run_command(run_monitor)
        if uc == 10:
            print_logfiles()
            fc = get_user_choice(5)
            if fc == 1:
                os.system("clear")
                run_command(access_log)
            elif fc == 2:
                os.system("clear")
                run_command(error_log)
            elif fc == 3:
                os.system("clear")
                run_command(server_1_log)
            elif fc == 4:
                os.system("clear")
                run_command(server_2_log)
            elif fc == 5:
                main()
        if uc == 11:
            main()  



if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\r  ")
        print("\nBye!")