export function get_headapp(self){
    let url=location.pathname;

    if(/^\/edit[\-_]form\/([^\/]+)\/(\d+)$/.test(url)){
        let arr=url.match(/^\/edit[\-_]form\/([^\/]+)\/(\d+)$/);
        self.headapp='edit-form';
        self.headapp_params={config:arr[1],id:arr[2],action:'edit'};
    }
    else if(/^\/edit[\-_]form\/([^\/]+)$/.test(url)){
        let arr=url.match(/^\/edit[\-_]form\/([^\/]+)$/);
        self.headapp='edit-form';
        self.headapp_params={config:arr[1],id:null,action:'new'};
        
    }
    else if(/^\/admin[\-_]table\/([^\/]+)$/.test(url)){
        let arr=url.match(/^\/admin[\-_]table\/([^\/]+)$/);
        self.set_active_manager_menu({element:'admin-table',config:arr[1]});
        self.headapp_params={config:arr[1]};
        self.headapp='admin-table';
    }
    else if(/^\/admin[\-_]tree\/([^\/]+)$/.test(url)){ // admin-tree
        let arr=url.match(/^\/admin[\-_]tree\/([^\/]+)$/);
        self.set_active_manager_menu({element:'admin-tree',config:arr[1]});
        self.headapp_params={config:arr[1]};
        self.headapp='admin-tree';
    }
    else if(url=='/const'){ // const
        self.headapp_params={};
        self.headapp='const';
    }
    else if(url=='/login'){ // login
        self.headapp='login';
        self.headapp_params={};
    }
    else if(url=='/register'){ // регистрация в системе (опционально)
        self.headapp='register'
        self.headapp_params={};
    }
    else if(url=='/remember'){ // напоминание пароля (опционально)
        self.headapp='remember'
        self.headapp_params={};
    }
    else if(/^\/parser-excel\/([^\/]+)$/.test(url)){ // parser-excel
        let arr=url.match(/^\/parser-excel\/([^\/]+)$/);
        self.headapp='parser-excel';
        self.headapp_params={config:arr[1]};
    }
    else if(/^\/documentation\/([^\/]+)$/.test(url)){ // documentation
        let arr=url.match(/\/([^\/]+)$/);
        self.headapp='documentation';
        self.headapp_params={config:arr[1]};

    }
    return 1;
}