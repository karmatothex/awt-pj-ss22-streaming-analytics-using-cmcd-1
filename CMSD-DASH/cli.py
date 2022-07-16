import os

from requests import get


banner = """
                ______ __  ___ _____  ____ 
               / ____//  |/  // ___/ / __ \\
              / /    / /|_/ / \__ \ / / / /
             / /___ / /  / / ___/ // /_/ / 
             \____//_/  /_/ /____//_____/  
                                           
                                            """


def start():
    print(">>> This is a simple command line interface to simulate the behavior of servers <<<\n")
    print("Available server:")
    print("1) Server 1")
    print("2) Server 2")


def print_options():
    print(">>> Options")
    print("1) Get current server load")
    print("2) Set current server load")
    print("3) Get number of connected clients")
    print("4) Set number of connected clients")
    print("5) Go back")


def choose_a_server(max_choice: int):
    while (True):
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
        command = "curl http://localhost:8080/getStatus" 
        os.system(command)   
        print("---------------------\n")
    elif server == "2":
        command = "curl http://localhost:8090/getStatus"
        os.system(command)  
        print("---------------------\n")


def set_server_load(server: str, load: int):
    if server == "1":
        command = "curl --header \"load: " + str(load) + "\" http://localhost:8080/setStatus" 
        os.system(command)   
        print("---------------------\n")
    elif server == "2":
        command = "curl --header \"load: " + str(load) + "\" http://localhost:8090/setStatus" 
        os.system(command) 
        print("---------------------\n")


def get_new_server_load(server: str):
    while (True):
        print("---------------------\n")
        user_input = input("What value should the server load be set to? (Values between 0 and 100 are possible): ")
        print("---------------------\n")
        if 0 <= int(user_input) <= 100:
            set_server_load(server, user_input)
            return
        print("This was sadly not an option.")
        exit()


def get_num_clients(server: str):
    if server == "1":
        command = "curl http://localhost:8080/getClients" 
        os.system(command)   
        print("---------------------\n")
    elif server == "2":
        command = "curl http://localhost:8090/getClients"
        os.system(command)  
        print("---------------------\n")


def set_num_clients(server: str, load: int):
    if server == "1":
        command = "curl --header \"nClients: " + str(load) + "\" http://localhost:8080/setClients" 
        os.system(command)   
        print("---------------------\n")
    elif server == "2":
        command = "curl --header \"nClients: " + str(load) + "\" http://localhost:8090/setClients" 
        os.system(command) 
        print("---------------------\n")


def get_new_num_clients(server: str):
    while (True):
        print("---------------------\n")
        user_input = input("How many clients shall join the server?: ")
        print("---------------------\n")
        if 0 <= int(user_input) <= 100:
            set_num_clients(server, user_input)
            return
        print("This was sadly not an option.")
        exit()



def main():
    print(banner)
    start()
    sc = choose_a_server(2)
    server = ""

    if sc == 1:
        server = "1"
    elif sc == 2:
        server = "2"

    while(True):
        print_options()
        uc = get_user_choice(5)
        if uc == 1:
            get_server_load(server)
        elif uc == 2:
            get_new_server_load(server)
        elif uc == 3:
            get_num_clients(server)
        elif uc == 4:
            get_new_num_clients(server)
        elif uc == 5:
            main()    


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nBye!")