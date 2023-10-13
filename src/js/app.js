// let set_menu_by_id=(s,menu_list,menu_id)=>{ // Сделано для того заинициализировать при загрузке ссылку вида: /#/admin_table/apteka:210 
//     for(let m of menu_list){
//         if(m.child.length){
//             set_menu_by_id(s,m.child,menu_id)
//         }
//         else if(m.id==menu_id){
//             s.MenuItem=m
//             if(m.params){
//                 s.setMenuItemParams(m.params);
//             }
//             s.setMenuItem(m)
//         } 
//     }
// }
const get_headapp_for_vue=(url)=>{
    

}
export const get_headapp=s=>{

    let url=location.pathname;
    let hash=location.hash, set_headapp=true
    
    if(url != process.env.BASE_URL){
        url=url.replace(process.env.BASE_URL,'/')
    }
    
    
    if(/^\/src:(.+)/.test(url)){
        
        
        let arr=url.match(/^\/src:(.+?)$/);
        
        s.MenuItem.type='src'
        s.MenuItem.value=arr[1]
        
        //return 1
    }
    // Vue-компонент, разбор 
    else if(/^\/vue\/(.+)$/.test(url)){
        //let menu_id=hash.match(/^#.+$/)[1];
        
        //set_menu_by_id(s,s.left_menu)
    
        let arr=url.match(/^\/vue(\/.+)$/)

        url=arr[1]
        
        
        set_headapp=false // vue-компонент в интерфейсе CRM
    }

       
    {
        url=url.replace(/:\d+$/,'')
        let headapp, headapp_params
        // if(url=='/' && !hash){
        //     console.log('THIS IS MAIN PAGE')
        //     //s.setMenuItem({type:'vue',value:'mainpage'})
        //     s.MenuItem.type='vue'
        //     s.MenuItem.value='mainpage'
        // }
        if(/^\/edit[\-_]form\/([^\/]+)\/(.+)$/.test(url)){
            let arr=url.match(/^\/edit[\-_]form\/([^\/]+)\/(\d+)$/)
            headapp='edit-form';
            headapp_params={config:arr[1],id:arr[2],action:'edit'};
        }
        else if(/^\/edit[\-_]form\/([^\/]+)$/.test(url)){
            let arr=url.match(/^\/edit[\-_]form\/([^\/]+)$/);
            headapp='edit-form';
            headapp_params={config:arr[1],id:null,action:'new'};
            
        }
        else if(/^\/admin[\-_]table\/([^\/:]+)$/.test(url)){
            let arr=url.match(/^\/admin[\-_]table\/([^\/:]+)$/);
            s.set_active_manager_menu({element:'admin-table',config:arr[1]});
            headapp_params={config:arr[1]};
            headapp='admin-table';
        }
        else if(/^\/admin[\-_]tree\/([^\/:]+)/.test(url)){ // admin-tree
            let arr=url.match(/^\/admin[\-_]tree\/([^\/:]+)(:\d+)?$/);
            s.set_active_manager_menu({element:'admin-tree',config:arr[1]});
            headapp_params={config:arr[1]};
            headapp='admin-tree';
        }
        else if(/^\/table\/([^\/]+)$/.test(url)){ // table -- произвольная таблица
            let arr=url.match(/^\/table\/([^\/]+)$/)
            headapp_params={config:arr[1]};
            headapp='table_component';
        }
        else if( /\/const\/(.+)/.test(url) ){ // const
            let arr=url.match(/^\/const\/(.+)$/);
            headapp='const';
            headapp_params={config:arr[1]};
        }
        else if(url=='/login'){ // login
            headapp='login';
            headapp_params={};
        }
        else if(url=='/register'){ // регистрация в системе (опционально)
            headapp='register'
            headapp_params={};
        }
        else if(url=='/remember'){ // напоминание пароля (опционально)
            headapp='remember'
            headapp_params={};
        }
        else if(/^\/stat-tool\/([^\/]+)$/.test(url)){ // parser-excel
            let arr=url.match(/^\/stat-tool\/([^\/]+)$/);
            headapp='stat-tool';
            headapp_params={config:arr[1]};
        }
        else if(/^\/parser-excel\/([^\/]+)$/.test(url)){ // parser-excel
            let arr=url.match(/^\/parser-excel\/([^\/]+)$/);
            headapp='parser-excel';
            headapp_params={config:arr[1]};
        }
        else if(/^\/documentation\/([^\/:]+)/.test(url)){ // documentation
            let arr=url.match(/\/([^\/:]+)/);
            headapp='documentation';
            headapp_params={config:arr[1]};
        }
        else if(/^\/[Ss]chedule\/([^\/]+)$/.test(url)){ // Расписание
            let arr=url.match(/\/([^\/]+)$/);
            
            headapp='schedule';
            headapp_params={config:arr[1]};
        }
        else if(/^\/VideoList\/([^\/]+)$/.test(url)){ // documentation
            let arr=url.match(/\/([^\/]+)$/);
            s.$nextTick(
                ()=>{
                    headapp='VideoList';
                    headapp_params={config:arr[1]};
                }
            )


        }
        if(set_headapp){
            s.headapp=headapp, s.headapp_params=headapp_params
        }
        else{
            s.MenuItem={type:'vue',value:headapp}
            s.MenuItemParams=headapp_params
        }
        

    }


    return 1;
}