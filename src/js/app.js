let set_menu_by_id=(s,menu_list,menu_id)=>{ // Сделано для того заинициализировать при загрузке ссылку вида: /#/admin_table/apteka:210 
    for(let m of menu_list){
        if(m.child.length){
            set_menu_by_id(s,m.child,menu_id)
        }
        else if(m.id==menu_id){
            s.MenuItem=m
            if(m.params){
                s.setMenuItemParams(m.params);
            }
            s.setMenuItem(m)
        } 
    }
}
export const get_headapp=s=>{
    let url=location.pathname;
    
    let hash=location.hash
    
    if(url != process.env.BASE_URL){
        url=url.replace(process.env.BASE_URL,'/')
    }
    
    if(/^#src:(.+)/.test(hash)){

        let arr=hash.match(/^#src:(.+?):\d+$/);
        
        s.MenuItem.type='src'
        s.MenuItem.value=arr[1]
        
        //s.MenuItem.type=value=arr[]1
    }
    else if(/^#.+:(\d+)$/.test(hash)){
        let menu_id=hash.match(/^#.+:(\d+)$/)[1];
        set_menu_by_id(s,s.left_menu,menu_id)
        
    }
    else{
        url=url.replace(/:\d+$/,'')
        log('url:',url)
        if(/^\/edit[\-_]form\/([^\/]+)\/(.+)$/.test(url)){
            let arr=url.match(/^\/edit[\-_]form\/([^\/]+)\/(\d+)$/)
            s.headapp='edit-form';
            s.headapp_params={config:arr[1],id:arr[2],action:'edit'};
        }
        else if(/^\/edit[\-_]form\/([^\/]+)$/.test(url)){
            let arr=url.match(/^\/edit[\-_]form\/([^\/]+)$/);
            s.headapp='edit-form';
            s.headapp_params={config:arr[1],id:null,action:'new'};
            
        }
        else if(/^\/admin[\-_]table\/([^\/:]+)$/.test(url)){
            let arr=url.match(/^\/admin[\-_]table\/([^\/:]+)$/);
            s.set_active_manager_menu({element:'admin-table',config:arr[1]});
            s.headapp_params={config:arr[1]};
            s.headapp='admin-table';
        }
        else if(/^\/admin[\-_]tree\/([^\/:]+)/.test(url)){ // admin-tree
            let arr=url.match(/^\/admin[\-_]tree\/([^\/:]+)(:\d+)?$/);
            s.set_active_manager_menu({element:'admin-tree',config:arr[1]});
            s.headapp_params={config:arr[1]};
            s.headapp='admin-tree';
        }
        else if(/^\/table\/([^\/]+)$/.test(url)){ // table -- произвольная таблица
            let arr=url.match(/^\/table\/([^\/]+)$/)
            s.headapp_params={config:arr[1]};
            s.headapp='table_component';
        }
        else if(url=='/const'){ // const
            s.headapp_params={};
            s.headapp='const';
        }
        else if(url=='/login'){ // login
            s.headapp='login';
            s.headapp_params={};
        }
        else if(url=='/register'){ // регистрация в системе (опционально)
            s.headapp='register'
            s.headapp_params={};
        }
        else if(url=='/remember'){ // напоминание пароля (опционально)
            s.headapp='remember'
            s.headapp_params={};
        }
        else if(/^\/parser-excel\/([^\/]+)$/.test(url)){ // parser-excel
            let arr=url.match(/^\/parser-excel\/([^\/]+)$/);
            s.headapp='parser-excel';
            s.headapp_params={config:arr[1]};
        }
        else if(/^\/documentation\/([^\/:]+)/.test(url)){ // documentation
            let arr=url.match(/\/([^\/:]+)/);
            s.headapp='documentation';
            s.headapp_params={config:arr[1]};
        }
        else if(/^\/[Ss]chedule\/([^\/]+)$/.test(url)){ // Расписание
            let arr=url.match(/\/([^\/]+)$/);
            log('schedule')
            s.headapp='schedule';
            s.headapp_params={config:arr[1]};
        }
        else if(/^\/VideoList\/([^\/]+)$/.test(url)){ // documentation
            let arr=url.match(/\/([^\/]+)$/);
            s.$nextTick(
                ()=>{
                    s.headapp='VideoList';
                    s.headapp_params={config:arr[1]};
                }
            )


        }
    }


    return 1;
}