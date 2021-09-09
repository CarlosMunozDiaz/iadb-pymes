let tooltip = d3.select('#chartTooltip');

//Variables para colores
let one_color = '#00827E';
let more_colors_first = '#22505F', more_colors_second = '#00827E', more_colors_third = '#4CB8E8', more_colors_fourth = '#919191', more_colors_fifth = 'red';

function getFirstChart() {
    //Bloque de la visualización
    let chartBlock = d3.select('#chart-one');

    //Lectura de datos
    let driveFile = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQF8MsCe2Bgx0qlou9BUzgTJH-1Z6_VtOegxqXOTAbgvOLR1zDMjBZzFdlGLuzywQ/pub?gid=1810268542&single=true&output=csv';
    d3.csv(driveFile, function(d) {
        return {
            pais: d.Pais,
            emp_pequena: +d['Pequeñas'],
            emp_mediana: +d['Medianas'],
            emp_grande: +d['Grandes'],
            rango: +d['Grandes'] - +d['Pequeñas']
        }
    }, function(error, data) {
        if (error) throw error;

        data = data.reverse();

        //Creación del elemento SVG en el contenedor
        let margin = {top: 5, right: 17.5, bottom: 20, left: 115};
        let {width, height, chart} = setChart(chartBlock, margin);

        //Disposición del eje X
        let x = d3.scaleLinear()
            .domain([0,100])
            .range([0, width])
            .nice();

        //Estilos para eje X
        let xAxis = function(g){
            g.call(d3.axisBottom(x).ticks(5).tickFormat(function(d) { return d + '%'; }))
            g.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr('y1', '0%')
                    .attr('y2', `-${height}`)
            })
            g.call(function(g){g.select('.domain').remove()});
        }

        //Inicialización eje X
        chart.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        //Disposición del eje Y
        let y = d3.scaleBand()
            .domain(data.map(function(d) { return d.pais; }))
            .range([height, 0]);

        let yAxis = function(svg){
            svg.call(d3.axisLeft(y).tickFormat(function(d) { return d; }))
            svg.call(function(g){g.selectAll('.tick line').remove()})
            svg.call(function(g){g.select('.domain').remove()});
        }        
        
        chart.append("g")
            .call(yAxis);

        //Visualización de datos
        // window.addEventListener('scroll', function() {
        //     if (!chartBlock.node().classList.contains('visible')){
        //         if(isElementInViewport(chartBlock.node())){
        //             chartBlock.node().classList.add('visible');
        //             initChart();
        //         }                
        //     }
        // });

        initChart();        

        function initChart() {
            //Hay líneas gruesas (para los rangos de cada país) > ¿Barras?
            chart.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr('class', function(d, i) { return `bar bar-${i}`; })
                .style('fill', '#cecece')
                .attr("x", function (d) {
                    return x(0);
                })
                .attr("y", function (d) {
                    return y(d.pais) + y.bandwidth() / 4;
                })            
                .attr("height", y.bandwidth() / 2)
                .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                    let css = e[i].getAttribute('class').split('-')[1];
                    //Texto
                    let html = `<p class="chart__tooltip--title">${d.pais}</p>
                                <p class="chart__tooltip--text">Diferencia: ${numberWithCommas(d.rango.toFixed(2))}</p>`;

                    tooltip.html(html);

                    //Posibilidad visualización línea diferente
                    let bars = chartBlock.selectAll('.bar');
                    
                    bars.each(function() {
                        this.style.opacity = '0.4';
                        if(this.getAttribute('class').indexOf(`bar-${css}`) != -1) {
                            this.style.opacity = '1';
                        }
                    });

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d, i, e) {
                    //Quitamos los estilos de la línea
                    let bars = chartBlock.selectAll('.bar');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });

                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                })
                .transition()
                .duration(1500)
                .attr("x", function (d) {
                    return x(Math.min(d.emp_pequena, d.emp_grande));
                })
                .attr("width", function (d) {
                    return Math.abs(x(d.emp_grande) - x(d.emp_pequena));
                });


            //Hay círculos para pequeñas - medianas - grandes empresas de cada país
            chart.selectAll('.circles')
                .data(data)
                .enter()
                .append('circle')
                .attr('class', 'web-circle web-circle-pequenas')
                .attr("r", function(d) { return y.bandwidth() / 4;})
                .attr("cx", function(d) { return x(d.emp_pequena); })
                .attr("cy", function(d) { return y(d.pais) + y.bandwidth() / 2; })
                .style("fill", `${more_colors_first}`)
                .style('opacity', '0')
                .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                    //Texto
                    let html = `<p class="chart__tooltip--title">${d.pais}</p>
                        <p class="chart__tooltip--text">Emp. pequeñas: ${numberWithCommas(d.emp_pequena)}%</p>`;
    
                    tooltip.html(html);
    
                    //Posibilidad visualización línea diferente
                    let current = e[i].getAttribute('class').split(" ")[1];
                    let others = e[i].getAttribute('class').split(" ")[0];
                    let otherCircles = chartBlock.selectAll(`.${others}`);

                    otherCircles.each(function() {
                        this.style.opacity = '0.4';
                        if(this.getAttribute('class').indexOf(`${current}`) != -1) {
                            this.style.opacity = '1';
                        }
                    });
    
                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);               
                })
                .on('mouseout', function(d, i, e) {
                    //Quitamos los estilos de la línea
                    let others = e[i].getAttribute('class').split(" ")[0];
                    let otherCircles = chartBlock.selectAll(`.${others}`);

                    otherCircles.each(function() {
                        this.style.opacity = '1';
                    });
    
                    //Quitamos el tooltip
                    getOutTooltip(tooltip);                
                })
                .transition()
                .delay(1500)
                .duration(750)
                .style('opacity', '1')

            chart.selectAll('.circles')
                .data(data)
                .enter()
                .append('circle')
                .attr('class', 'web-circle web-circle-medianas')
                .attr("r", function(d) { return y.bandwidth() / 4;})
                .attr("cx", function(d) { return x(d.emp_mediana); })
                .attr("cy", function(d) { return y(d.pais) + y.bandwidth() / 2; })
                .style("fill", `${more_colors_second}`)
                .style('opacity', '0')
                .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                    //Texto
                    let html = `<p class="chart__tooltip--title">${d.pais}</p>
                        <p class="chart__tooltip--text">Emp. medianas: ${numberWithCommas(d.emp_mediana)}%</p>`;
    
                    tooltip.html(html);
    
                    //Posibilidad visualización línea diferente
                    let current = e[i].getAttribute('class').split(" ")[1];
                    let others = e[i].getAttribute('class').split(" ")[0];
                    let otherCircles = chartBlock.selectAll(`.${others}`);

                    otherCircles.each(function() {
                        this.style.opacity = '0.4';
                        if(this.getAttribute('class').indexOf(`${current}`) != -1) {
                            this.style.opacity = '1';
                        }
                    });
    
                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);               
                })
                .on('mouseout', function(d, i, e) {
                    //Quitamos los estilos de la línea
                    let others = e[i].getAttribute('class').split(" ")[0];
                    let otherCircles = chartBlock.selectAll(`.${others}`);

                    otherCircles.each(function() {
                        this.style.opacity = '1';
                    });
    
                    //Quitamos el tooltip
                    getOutTooltip(tooltip);                
                })
                .transition()
                .delay(1500)
                .duration(750)
                .style('opacity', '1')

            chart.selectAll('.circles')
                .data(data)
                .enter()
                .append('circle')
                .attr('class', 'web-circle web-circle-grandes')
                .attr("r", function(d) { return y.bandwidth() / 4; })
                .attr("cx", function(d) { return x(d.emp_grande); })
                .attr("cy", function(d) { return y(d.pais) + y.bandwidth() / 2; })
                .style("fill", `${more_colors_third}`)
                .style('opacity', '0')
                .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                    //Texto
                    let html = `<p class="chart__tooltip--title">${d.pais}</p>
                        <p class="chart__tooltip--text">Emp. grandes: ${numberWithCommas(d.emp_grande)}%</p>`;
    
                    tooltip.html(html);
    
                    //Posibilidad visualización línea diferente
                    let current = e[i].getAttribute('class').split(" ")[1];
                    let others = e[i].getAttribute('class').split(" ")[0];
                    let otherCircles = chartBlock.selectAll(`.${others}`);

                    otherCircles.each(function() {
                        this.style.opacity = '0.4';
                        if(this.getAttribute('class').indexOf(`${current}`) != -1) {
                            this.style.opacity = '1';
                        }
                    });
    
                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);               
                })
                .on('mouseout', function(d, i, e) {
                    //Quitamos los estilos de la línea
                    let others = e[i].getAttribute('class').split(" ")[0];
                    let otherCircles = chartBlock.selectAll(`.${others}`);

                    otherCircles.each(function() {
                        this.style.opacity = '1';
                    });
    
                    //Quitamos el tooltip
                    getOutTooltip(tooltip);                
                })
                .transition()
                .delay(1500)
                .duration(750)
                .style('opacity', '1')
        }                   
    });
}

function getSecondChart() {
    //Bloque de la visualización
    let chartBlock = d3.select('#chart-two');

    //Lectura de datos
    let driveFile = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQF8MsCe2Bgx0qlou9BUzgTJH-1Z6_VtOegxqXOTAbgvOLR1zDMjBZzFdlGLuzywQ/pub?gid=1410490223&single=true&output=csv';
    d3.csv(driveFile, function(d) {
        return {
            tipo: d.tipo,
            tipo_eje: d.tipo_2,
            pais: d.pais,
            valor: +d.valor.replace(/,/g, '.').replace('%','')
        }
    }, function(error, data) {
        if (error) throw error;

        //Creación del elemento SVG en el contenedor
        let margin = {top: 5, right: 17.5, bottom: 145, left: 40};
        let {width, height, chart} = setChart(chartBlock, margin);

        //Agrupación de datos para barras agrupadas
        let tipos = d3.nest()
            .key(function(d) { return d.tipo_eje; })
            .entries(data);

        let ejeTipos = tipos.map(function(d) { return d.key + ":" + d.values[0].tipo; });
        let columnas = ['Brasil', 'México', 'Colombia', 'Chile', 'Argentina'];
        
        //Eje X > Países y columnas
        let x0 = d3.scaleBand()
            .rangeRound([0,width])
            .domain(ejeTipos);
        
        let x1 = d3.scaleBand()
            .range([0, x0.bandwidth()])
            .paddingInner(0.25)
            .paddingOuter(0.5)
            .domain(columnas);

        let xAxis = function(g){
            g.call(d3.axisBottom(x0).tickFormat(function(d) { return d.split(":")[0]; }))
            g.call(function(g){
                g.selectAll('.tick text')
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", function(d) {
                        return "rotate(-65)" 
                    });
            })
            g.call(function(g){g.selectAll('.tick line').remove()});
            g.call(function(g){g.select('.domain').remove()});
            g.call(function(g){g.selectAll('.tick text').on('mouseenter mousedown mousemove mouseover', function(d) {
                //Texto tooltip
                let html = `<p class="chart__tooltip--title">${d.split(":")[1]}</p>`;                
                tooltip.html(html);

                //Tooltip
                positionTooltip(window.event, tooltip);
                getInTooltip(tooltip);
            })});
            g.call(function(g){g.selectAll('.tick text').on('mouseleave', function(d) { 
                //Quitamos el tooltip
                getOutTooltip(tooltip); 
            })});
        }

        chart.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let y = d3.scaleLinear()
            .range([height, 0])
            .domain([0,80]);
    
        let yAxis = function(g){
            g.call(d3.axisLeft(y).ticks(5).tickFormat(function(d) { return d + '%'; }))
            g.call(function(g){g.select('.domain').remove()})
            g.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr('x1', '0%')
                    .attr('x2', `${width}`)
            });
        }

        chart.append("g")
            .call(yAxis);

        let slice = chart.selectAll(".slice")
            .data(tipos)
            .enter()
            .append("g")
            .attr("class", "g")
            .attr("transform",function(d) { return "translate(" + x0(d.key + ":" + d.values[0].tipo) + ",0)"; });

        //Visualización de datos
        window.addEventListener('scroll', function() {
            if (!chartBlock.node().classList.contains('visible')){
                if(isElementInViewport(chartBlock.node())){
                    chartBlock.node().classList.add('visible');
                    initChart();
                }                
            }
        });

        function initChart() {
            slice.selectAll("rect")
                .data(function(d) { return d.values; })
                .enter()
                .append("rect")
                .attr("x", function(d) { return x1(d.pais) })
                .attr("y", function(d) { return y(0); })
                .attr('class', function(d,i) {
                    if(d.pais == 'Brasil') {
                        return 'rect rect-primero';
                    } else if (d.pais == 'México') {
                        return 'rect rect-segundo';
                    } else if (d.pais == 'Colombia') {
                        return 'rect rect-tercero';
                    } else if (d.pais == 'Chile') {
                        return 'rect rect-cuarto';
                    } else {
                        return 'rect rect-quinto';
                    }
                })
                .attr("width", x1.bandwidth())
                .style('fill',function(d) { return d.pais == 'Brasil' ? more_colors_first : d.pais == 'México' ? more_colors_second : d.pais == 'Colombia' ? more_colors_third : d.pais == 'Chile' ? more_colors_fourth : more_colors_fifth})
                .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                    let css = e[i].getAttribute('class').split('-')[1];

                    //Texto
                    let html = `<p class="chart__tooltip--title">${d.pais} (${d.tipo})</p>
                                <p class="chart__tooltip--text">${d.valor}%</p>`;

                    tooltip.html(html);

                    //Posibilidad visualización línea diferente
                    let rects = chartBlock.selectAll('.rect');

                    rects.each(function() {
                        this.style.opacity = '0.4';
                        if(this.getAttribute('class').indexOf(`rect-${css}`) != -1) {
                            this.style.opacity = '1';
                        }
                    });

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d, i, e) {
                    //Quitamos los estilos de la línea
                    let rects = chartBlock.selectAll('.rect');
                    rects.each(function() {
                        this.style.opacity = '1';
                    });

                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                })
                .transition()
                .duration(3000)            
                .attr("y", function(d) { return y(Math.max(0, d.valor)); })     
                .attr('height', d => Math.abs(y(d.valor) - y(0)));
        }                
    });
}

function getThirdChart() {
    //Bloque de la visualización
    let chartBlock = d3.select('#chart-three');

    //Lectura de datos
    let driveFile = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQF8MsCe2Bgx0qlou9BUzgTJH-1Z6_VtOegxqXOTAbgvOLR1zDMjBZzFdlGLuzywQ/pub?gid=227725159&single=true&output=csv';
    d3.csv(driveFile, function(error, data) {
        if (error) throw error;

        //Creación del elemento SVG en el contenedor
        let margin = {top: 15, right: 5, bottom: 120, left: 30};
        let {width, height, chart} = setChart(chartBlock, margin);

        //Disposición del eje X
        let x = d3.scaleBand()
            .domain(data.map(function(d) { return d.tipo; }))
            .range([0, width]);

        //Estilos para eje X
        let xAxis = function(g){
            g.call(d3.axisBottom(x).tickFormat(function(d) { return d; }))
            g.call(function(g){g.selectAll('.tick line').remove()})
            g.call(function(g){g.select('.domain').remove()})
            g.call(function(g){
                g.selectAll('.tick text')
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", function(d) {
                        return "rotate(-65)" 
                    });
            });
        }

        //Inicialización eje X
        chart.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        //Disposición del eje Y
        let y = d3.scaleLinear()
            .domain([0,60])
            .range([height, 0]);

        let yAxis = function(svg){
            svg.call(d3.axisLeft(y).ticks(3).tickFormat(function(d) { return d; }))
            svg.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr('x1', '0%')
                    .attr('x2', `${width}`)
            })
            svg.call(function(g){g.select('.domain').remove()});
        }

        chart.append("g")
            .call(yAxis);

        //Visualización de datos
        window.addEventListener('scroll', function() {
            if (!chartBlock.node().classList.contains('visible')){
                if(isElementInViewport(chartBlock.node())){
                    chartBlock.node().classList.add('visible');
                    initChart();
                }                
            }
        });

        function initChart() {
            chart.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr('class', function(d, i) { return `bar bar-${i}`; })
                .style('fill', one_color)
                .attr("y", function (d) {
                    return y(0);
                })
                .attr("x", function (d, i) {
                    return x(d.tipo) + x.bandwidth() / 4;                                       
                })            
                .attr("width", x.bandwidth() / 2)
                .on('mouseenter mousedown mousemove mouseover', function(d, i, e) {
                    let css = e[i].getAttribute('class').split('-')[1];
                    //Texto
                    let html = `<p class="chart__tooltip--title">${d.tipo}</p>
                                <p class="chart__tooltip--text">Medidas: ${d.medidas}</p>`;

                    tooltip.html(html);

                    //Posibilidad visualización línea diferente
                    let bars = chartBlock.selectAll('.bar');
                    
                    bars.each(function() {
                        this.style.opacity = '0.4';
                        if(this.getAttribute('class').indexOf(`bar-${css}`) != -1) {
                            this.style.opacity = '1';
                        }
                    });

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d, i, e) {
                    //Quitamos los estilos de la línea
                    let bars = chartBlock.selectAll('.bar');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });

                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                })
                .transition()
                .duration(3000)
                .attr("y", function (d, i) {
                    return y(+d.medidas);                                        
                })
                .attr("height", function (d, i) {
                    return height - y(+d.medidas);                                        
                });
        }                   
    });
}

getFirstChart();
getSecondChart();
getThirdChart();

/* Visualization helpers */
function isElementInViewport(ele) {
    const { top, bottom } = ele.getBoundingClientRect();
    const vHeight = (window.innerHeight || document.documentElement.clientHeight);
    
    return ( 
        (top > 0 || bottom > 0) && bottom < vHeight
    );
};

// PRUEBA SCROLL PARA INICIAR ANIMACIÓN CUANDO ENTRE
let charts = document.getElementsByClassName('chart__viz');

/* Inicialización del gráfico */
function setChart(chartBlock, margin) {
    let width = parseInt(chartBlock.style('width')) - margin.left - margin.right,
    height = parseInt(chartBlock.style('height')) - margin.top - margin.bottom;

    let chart = chartBlock
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    return {margin, width, height, chart};
}

function numberWithCommas(x) {
    //return x.toString().replace(/\./g, ',').replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".");
    return x.toString().replace(/\./g, ',');
}