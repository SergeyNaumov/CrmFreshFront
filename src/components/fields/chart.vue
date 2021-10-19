<template>
    <div :style="field.style" >
                
                 <canvas class="diagramm"
                  :width="width" 
                  :height="height"
                  :id="id"


                />
                      
                

    </div>
        
</template>
<script>
    import Chart from '../../js/chart.js'

    export default {
        props:['form','field'],

        mounted(){
            this.id='d_'+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
            let f=this.field
            if(f.width)
                this.width=f.width
            if(f.height)
                this.height=f.height

            setTimeout(
                ()=>{this.draw()},
                500
            )


            
        },
        data:function(){
           return {
                width:500,
                height:200,
                id:''
           }
        },
        methods:{
           draw(){
                let canvas_el=document.getElementById(this.id)
               
                let ctx = canvas_el.getContext('2d');
               
                let f=this.field
                let data=f.values
                let labels=f.labels
                let description=f.description

                for(let i in data){
                    data[i]=parseInt(data[i])
                }
                console.log('subtype: ',f.type)
                if(f.subtype=='circle'){
                        let myChart = new Chart(ctx, {
                            type: 'doughnut',
                            data: {
                                labels: labels,
                                datasets: [{
                                    data: data,
                                    backgroundColor: [ '#00e676','#e91e63',],
                                    borderWidth: 0.5 ,
                                    borderColor: '#ddd'
                                }]
                            },
                            options: {
                                responsive: false,
                                title: {
                                    display: true,
                                    text: description,
                                    position: 'top',
                                    fontSize: 16,
                                    fontColor: '#111',
                                    padding: 20
                                },
                                legend: {
                                    display: true,
                                    position: 'top',
                                    //fullSize: true,
                                    fontSize: 50,
                                    labels: {
                                        boxWidth: 20,
                                        fontColor: '#111',
                                        padding: 15
                                    }
                                },
                                tooltips: {
                                    enabled: false
                                },
                                plugins: {
                                    datalabels: {
                                        color: '#111',
                                        textAlign: 'center',
                                        font: {
                                            lineHeight: 1
                                        },
                                        formatter: function(value, ctx) {
                                            return ctx.chart.data.labels[ctx.dataIndex] + '\n' + value + '%';
                                        }
                                    }
                                }
                            }
                        })
                }
           }
        }
    }
</script>
<style scoped>
    table th {vertical-align: top;}
    canvas {max-width: 100%; height: auto;}

</style>