/**
 * Arquivo: script.js
 * Calculadora Antropométrica para o site do Davisinho
 */

// =================================================================
// CONSTANTES DE CLASSIFICAÇÃO
// =================================================================
/**
 * Tabela de Classificação do Percentual de Gordura (%GC) em Adultos
 * Baseada em Jackson & Pollock (1984) / ACSM (Adaptada)
 * Os valores representam o LIMITE SUPERIOR para cada categoria.
 * Exemplo: Se for MASCULINO, 20-29 anos, até 17.5% é "Bom".
 */
const CLASSIFICACAO_GORDURA = {
    'masculino': [
        { faixa: '20-29', categorias: { Atleta: 8.5, Excelente: 12.0, Bom: 17.5, Mediano: 21.0, Ruim: 24.5 } },
        { faixa: '30-39', categorias: { Atleta: 11.0, Excelente: 15.0, Bom: 20.0, Mediano: 24.0, Ruim: 27.0 } },
        { faixa: '40-49', categorias: { Atleta: 12.0, Excelente: 17.0, Bom: 22.0, Mediano: 26.0, Ruim: 29.0 } },
        { faixa: '50+', categorias: { Atleta: 13.0, Excelente: 19.0, Bom: 23.5, Mediano: 27.5, Ruim: 30.5 } }
    ],
    'feminino': [
        { faixa: '20-29', categorias: { Atleta: 17.0, Excelente: 22.5, Bom: 27.5, Mediano: 32.0, Ruim: 36.0 } },
        { faixa: '30-39', categorias: { Atleta: 19.0, Excelente: 24.5, Bom: 29.0, Mediano: 33.5, Ruim: 37.5 } },
        { faixa: '40-49', categorias: { Atleta: 20.0, Excelente: 26.5, Bom: 31.0, Mediano: 35.0, Ruim: 39.0 } },
        { faixa: '50+', categorias: { Atleta: 21.0, Excelente: 28.5, Bom: 32.5, Mediano: 37.0, Ruim: 40.5 } }
    ]
};

// =================================================================
// 1. FUNÇÃO PRINCIPAL DE CONTROLE
// =================================================================

function calcularAvaliacao() {
    // 1. Coletar Dados Essenciais (Gerais e Circunferências)
    const nome = document.getElementById('nome').value;
    const idade = parseFloat(document.getElementById('idade').value) || 0;
    const estatura = parseFloat(document.getElementById('estatura').value) || 0; // cm
    const peso = parseFloat(document.getElementById('peso').value) || 0; // kg
    const cintura = parseFloat(document.getElementById('cintura').value) || 0; // cm
    const quadril = parseFloat(document.getElementById('quadril').value) || 0; // cm

    // Garante que o input radio de sexo foi selecionado
    const sexoElement = document.querySelector('input[name="sexo"]:checked');
    const sexo = sexoElement ? sexoElement.value : null;

    const protocoloSelecionado = document.getElementById('protocolo').value;

    // 2. Coletar TODAS as Dobras Cutâneas (mm)
    const triceps = parseFloat(document.getElementById('triceps').value) || 0;
    const subescapular = parseFloat(document.getElementById('subescapular').value) || 0;
    const peitoral = parseFloat(document.getElementById('peitoral').value) || 0;
    const axilarMedia = parseFloat(document.getElementById('axilarMedia').value) || 0;
    const abdominal = parseFloat(document.getElementById('abdominal').value) || 0;
    const supraIliaca = parseFloat(document.getElementById('supraIliaca').value) || 0;
    const coxa = parseFloat(document.getElementById('coxa').value) || 0;
    const biceps = parseFloat(document.getElementById('biceps').value) || 0;
    // const panturrilha = parseFloat(document.getElementById('panturrilha').value) || 0; // Se adicionar no HTML
    
    // Objeto principal de resultados
    let resultados = { nome: nome, idade: idade, sexo: sexo, dobras: null, indices: [] }; 

    // Validação Básica
    if (!sexo || !protocoloSelecionado || idade <= 0 || estatura <= 0 || peso <= 0) {
        document.getElementById('resultado').innerText = "Por favor, preencha todos os campos obrigatórios (Nome, Idade, Sexo, Estatura, Peso e escolha um Protocolo).";
        return;
    }

// 3. Chamada Condicional do Protocolo de Dobras
    if (protocoloSelecionado === 'jp7') {
        resultados.dobras = calcularJP7(triceps, subescapular, axilarMedia, peitoral, abdominal, supraIliaca, coxa, idade, sexo);
    } else if (protocoloSelecionado === 'jp3') { 
        // OBS: JP3 não usa Bíceps, Subescapular, Axilar Média.
        resultados.dobras = calcularJP3(triceps, peitoral, abdominal, supraIliaca, coxa, idade, sexo);
    } else if (protocoloSelecionado === 'guedes') {
        // OBS: Guedes não usa Bíceps, Axilar Média, Peitoral, Coxa (Homem) ou Tríceps, Abdominal (Mulher).
        resultados.dobras = calcularGuedes(triceps, subescapular, abdominal, supraIliaca, coxa, idade, sexo);
    } else if (protocoloSelecionado === 'durnin') { // <-- ADICIONE ESTA CONDIÇÃO
        resultados.dobras = calcularDurninWomersley(biceps, triceps, subescapular, supraIliaca, idade, sexo);
    }

    // 4. Chamada dos Índices de Circunferência (Calculados sempre)
    // Para RCE e RCQ, garantimos que as circunferências foram medidas
    if (cintura > 0 && quadril > 0) {
        // IMC
        resultados.indices.push(calcularIMC(peso, estatura)); 
        // Relação Cintura-Estatura
        resultados.indices.push(calcularRCE(cintura, estatura));
        // Relação Cintura-Quadril
        resultados.indices.push(calcularRCQ(cintura, quadril, sexo));
    } else {
        resultados.indices.push({ indice: "Índices de Risco", status: "Circunferências da Cintura e/ou Quadril não fornecidas para cálculo de RCE/RCQ." });
    }

    // 5. Mostrar Resultados
    exibirResultados(resultados);

    // 6. Habilita a Exportação após cálculo bem sucedido
document.getElementById('exportarDados').onclick = function() {
    exportarParaCSV(resultados);
};
}

// =================================================================
// 2. PROTOCOLOS DE DOBRAS CUTÂNEAS
// =================================================================

/**
 * Protocolo: Jackson & Pollock 7 Dobras (JP7)
 * Estima a Densidade Corporal a partir da soma das 7 dobras, Idade e Sexo.
 */
function calcularJP7(tr, sub, ax, pe, ab, si, cx, idade, sexo) {
    const soma7Dobras = tr + sub + ax + pe + ab + si + cx;
    let dc; // Densidade Corporal
    
    // Verifica se as 7 dobras foram medidas (ou se a soma é 0)
    if (soma7Dobras === 0) {
        return { erro: "O Protocolo J&P 7 dobras exige as 7 medidas." };
    }

    // Peculiaridade: Alerta se a soma for muito alta (pode indicar erro de medição ou alta adiposidade)
    if (soma7Dobras > 300) {
        console.warn("A soma das dobras é muito alta (>300mm), a estimativa JP7 pode ser menos precisa.");
    }

    if (sexo === 'masculino') {
        // FÓRMULA JP7 HOMENS (18-61 anos)
        dc = 1.112 - (0.00043499 * soma7Dobras) + (0.00000055 * Math.pow(soma7Dobras, 2)) - (0.00028826 * idade);
    } else if (sexo === 'feminino') {
        // FÓRMULA JP7 MULHERES (18-55 anos)
        dc = 1.0970 - (0.00046971 * soma7Dobras) + (0.00000056 * Math.pow(soma7Dobras, 2)) - (0.00012828 * idade);
    } else {
        return { erro: "Sexo não especificado para o cálculo JP7." };
    }

    // Cálculo do Percentual de Gordura (Fórmula de Siri)
    const percentualGordura = ((4.95 / dc) - 4.50) * 100;
    
    return {
        protocolo: "Jackson & Pollock 7 Dobras",
        somaDobras: soma7Dobras.toFixed(2),
        densidadeCorporal: dc.toFixed(4),
        percentualGordura: percentualGordura.toFixed(2),
        peculiaridade: "Válido para 18-61 anos (homens) e 18-55 anos (mulheres). É o mais completo e mais referenciado no campo de atletas."
    };
}


/**
 * Protocolo: Guedes (1994)
 * Estima a Densidade Corporal a partir da Soma de 3 Dobras e Sexo.
 */
function calcularGuedes(tr, se, ab, si, cx, idade, sexo) {
    let soma3Dobras;
    let logSoma;
    let dc; 
    let peculiaridadeDobras;

    if (sexo === 'masculino') {
        // Dobras Guedes Homens: Tríceps (tr), Supra-Ilíaca (si), Abdome (ab)
        soma3Dobras = tr + si + ab;
        peculiaridadeDobras = `TRÍCEPS (${tr}mm) + SUPRA-ILÍACA (${si}mm) + ABDOME (${ab}mm)`;
        
        if (soma3Dobras === 0) {
            return { erro: "O Protocolo Guedes (Homens) exige as dobras Tríceps, Supra-Ilíaca e Abdome." };
        }
        
        logSoma = Math.log10(soma3Dobras);
        
        // FÓRMULA GUEDES HOMENS: DC = 1.17136 - 0.0632 log(Σ3)
        dc = 1.17136 - (0.0632 * logSoma);

    } else if (sexo === 'feminino') {
        // Dobras Guedes Mulheres: Subescapular (se), Supra-Ilíaca (si), Coxa (cx)
        soma3Dobras = se + si + cx;
        peculiaridadeDobras = `SUBESCAPULAR (${se}mm) + SUPRA-ILÍACA (${si}mm) + COXA (${cx}mm)`;

        if (soma3Dobras === 0) {
            return { erro: "O Protocolo Guedes (Mulheres) exige as dobras Subescapular, Supra-Ilíaca e Coxa." };
        }

        logSoma = Math.log10(soma3Dobras);
        
        // FÓRMULA GUEDES MULHERES: DC = 1.17136 - 0.0645 log(Σ3)
        dc = 1.17136 - (0.0645 * logSoma);
    } else {
        return { erro: "Sexo não especificado para o cálculo Guedes." };
    }

    // Cálculo do Percentual de Gordura (Fórmula de Siri)
    const percentualGordura = ((4.95 / dc) - 4.50) * 100;
    
    return {
        protocolo: "Protocolo de Guedes (3 Dobras)",
        dobrasUtilizadas: peculiaridadeDobras,
        somaDobras: soma3Dobras.toFixed(2),
        densidadeCorporal: dc.toFixed(4),
        percentualGordura: percentualGordura.toFixed(2),
        peculiaridade: "Altamente recomendado para a população brasileira. Não considera a idade diretamente na fórmula, mas é mais preciso para adultos jovens (18-30 anos)."
    };
}


// =================================================================
// 3. ÍNDICES DE CIRCUNFERÊNCIA E GERAIS
// =================================================================

/**
 * Índice de Massa Corporal (IMC)
 */
function calcularIMC(peso, estatura) {
    const estaturaMetros = estatura / 100;
    const imc = peso / (estaturaMetros * estaturaMetros);
    let status;

    if (imc < 18.5) { status = "Baixo Peso"; }
    else if (imc < 25) { status = "Peso Normal"; }
    else if (imc < 30) { status = "Sobrepeso"; }
    else if (imc < 35) { status = "Obesidade Grau I"; }
    else if (imc < 40) { status = "Obesidade Grau II"; }
    else { status = "Obesidade Grau III"; }

    return {
        indice: "Índice de Massa Corporal (IMC)",
        valor: imc.toFixed(2),
        status: status,
        peculiaridade: "Não diferencia massa muscular de gordura. Deve ser complementado por outros índices (RCE, Dobras)."
    };
}

/**
 * Relação Cintura-Estatura (RCE)
 */
function calcularRCE(cinturaCm, estaturaCm) {
    const rce = cinturaCm / estaturaCm; // cm / cm (a proporção é sem unidade)
    let status;

    // Regra universal: Cintura menor que a metade da altura.
    if (rce < 0.5) {
        status = "Baixo Risco (Saudável)";
    } else if (rce <= 0.6) {
        status = "Atenção (Risco Moderado)";
    } else {
        status = "Alto Risco (Elevado)";
    }

    return {
        indice: "Relação Cintura-Estatura (RCE)",
        valor: rce.toFixed(2),
        status: status,
        peculiaridade: "Considerado um excelente preditor de risco cardiovascular, pois seu valor limite de 0.5 (ou 50%) é o mesmo para todas as idades e sexos."
    };
}

/**
 * Relação Cintura-Quadril (RCQ)
 */
function calcularRCQ(cinturaCm, quadrilCm, sexo) {
    const rcq = cinturaCm / quadrilCm;
    let status;
    let limiteRisco;

    if (sexo === 'masculino') {
        limiteRisco = 0.95;
        status = rcq <= limiteRisco ? "Baixo Risco" : "Risco Elevado";
    } else if (sexo === 'feminino') {
        limiteRisco = 0.85;
        status = rcq <= limiteRisco ? "Baixo Risco" : "Risco Elevado";
    } else {
        status = "Sexo não especificado para classificação de risco.";
    }

    return {
        indice: "Relação Cintura-Quadril (RCQ)",
        valor: rcq.toFixed(2),
        status: status,
        peculiaridade: `Usado para avaliar o padrão de distribuição de gordura. O risco é elevado se o valor for superior a ${limiteRisco} (Homens) ou ${limiteRisco} (Mulheres).`
    };
}


// =================================================================
// 4. FUNÇÃO DE EXIBIÇÃO DE RESULTADOS
// =================================================================

function exibirResultados(resultados) {
    let htmlOutput = `
        <div class="resultado-container">
            <h3>Olá, ${resultados.nome} (${resultados.idade} anos)!</h3>
    `;
    
    // --------------------------------------------------
    // 1. RESULTADO DO PROTOCOLO DE DOBRAS CUTÂNEAS
    // --------------------------------------------------
    if (resultados.dobras && !resultados.dobras.erro) {
        
        // 1.1. Obter Classificação do %GC
        const percentualGordura = parseFloat(resultados.dobras.percentualGordura);
        const classificacaoGorduraCompleta = classificarPercentualGordura(percentualGordura, resultados.idade, resultados.sexo);
        
        // Extrai apenas o status principal (ex: "Excelente" de "Excelente (Faixa Etária: 20-29)")
        const statusGordura = classificacaoGorduraCompleta.split(' ')[0].toLowerCase().replace(/[\(\)]/g, ''); 
        // Cria a classe CSS dinâmica (ex: status-excelente)
        const badgeClass = `status-${statusGordura}`; 
        
        htmlOutput += `
            <div class="box-principal">
                <h3>Resultado do Protocolo de ${resultados.dobras.protocolo}</h3>
                
                <div class="resultado-linha">
                    <span class="label">Gordura Corporal Estimada:</span>
                    <span class="valor">${resultados.dobras.percentualGordura}%</span>
                </div>
                
                <div class="resultado-linha">
                    <span class="label">Classificação do %GC:</span>
                    <span class="status-badge ${badgeClass}">${classificacaoGorduraCompleta}</span>
                </div>
                
                <div class="resultado-linha">
                    <span class="label">Densidade Corporal (DC):</span>
                    <span class="valor">${resultados.dobras.densidadeCorporal}</span>
                </div>
                
                <div class="peculiaridade">
                    * ${resultados.dobras.peculiaridade}
                </div>
            </div>
        `;
    } else if (resultados.dobras && resultados.dobras.erro) {
        // Bloco de ERRO (simples, mas em destaque)
        htmlOutput += `
            <div class="box-principal" style="background-color: #f8d7da; border-color: #f5c6cb;">
                <h3>Erro no Cálculo de Dobras</h3>
                <p style="color: #721c24;">${resultados.dobras.erro}</p>
            </div>
        `;
    }
    
    // --------------------------------------------------
    // 2. ÍNDICES DE RISCO ANTROPOMÉTRICO (GRID DE CARDS)
    // --------------------------------------------------
    htmlOutput += `
        <h2>Índices de Risco Antropométrico</h2>
        <div class="indices-grid">
    `;

    // Cria um card para cada índice
    resultados.indices.forEach(indice => {
        // Função auxiliar para determinar a cor do status de risco
        const obterStatusClass = (status) => {
            if (status.includes("Normal") || status.includes("Baixo")) return "status-excelente";
            if (status.includes("Sobrepeso") || status.includes("Moderado")) return "status-bom";
            if (status.includes("Obesidade") || status.includes("Elevado")) return "status-risco";
            return "";
        };
        
        const statusClass = obterStatusClass(indice.status);

        htmlOutput += `
            <div class="indice-card">
                <h4>${indice.indice}</h4>
                <div class="resultado-linha">
                    <span class="label">Valor:</span>
                    <span class="valor">${indice.valor || 'N/A'}</span>
                </div>
                <div class="resultado-linha">
                    <span class="label">Status/Risco:</span>
                    <span class="status-badge ${statusClass}">${indice.status}</span>
                </div>
                <p class="peculiaridade">${indice.peculiaridade || 'N/A'}</p>
            </div>
        `;
    });

    htmlOutput += `
        </div> </div> `;

    // O mais importante: Usamos .innerHTML e não .innerText para renderizar o HTML
    document.getElementById('resultado').innerHTML = htmlOutput; 
}

/**
 * Protocolo: Jackson & Pollock 3 Dobras (JP3)
 * Estima a Densidade Corporal a partir da soma das 3 dobras, Idade e Sexo.
 * NOTA: As dobras utilizadas mudam drasticamente entre homens e mulheres.
 */
function calcularJP3(tr, pe, ab, si, cx, idade, sexo) {
    let soma3Dobras;
    let dc; // Densidade Corporal
    let peculiaridadeDobras;

    if (sexo === 'masculino') {
        // Dobras JP3 Homens: Peitoral (pe), Abdominal (ab), Coxa (cx)
        soma3Dobras = pe + ab + cx;
        peculiaridadeDobras = `PEITORAL (${pe}mm) + ABDOMINAL (${ab}mm) + COXA (${cx}mm)`;

        if (soma3Dobras === 0) {
             return { erro: "O Protocolo JP3 (Homens) exige as dobras Peitoral, Abdominal e Coxa." };
        }
        
        // FÓRMULA JP3 HOMENS
        dc = 1.10938 - (0.0008267 * soma3Dobras) + (0.0000016 * Math.pow(soma3Dobras, 2)) - (0.0002574 * idade);

    } else if (sexo === 'feminino') {
        // Dobras JP3 Mulheres: Tríceps (tr), Supra-Ilíaca (si), Coxa (cx)
        soma3Dobras = tr + si + cx;
        peculiaridadeDobras = `TRÍCEPS (${tr}mm) + SUPRA-ILÍACA (${si}mm) + COXA (${cx}mm)`;

        if (soma3Dobras === 0) {
            return { erro: "O Protocolo JP3 (Mulheres) exige as dobras Tríceps, Supra-Ilíaca e Coxa." };
        }

        // FÓRMULA JP3 MULHERES
        dc = 1.0994921 - (0.0009929 * soma3Dobras) + (0.0000023 * Math.pow(soma3Dobras, 2)) - (0.0001392 * idade);
    } else {
        return { erro: "Sexo não especificado para o cálculo JP3." };
    }

    // Cálculo do Percentual de Gordura (Fórmula de Siri)
    const percentualGordura = ((4.95 / dc) - 4.50) * 100;
    
    return {
        protocolo: "Jackson & Pollock 3 Dobras",
        dobrasUtilizadas: peculiaridadeDobras,
        somaDobras: soma3Dobras.toFixed(2),
        densidadeCorporal: dc.toFixed(4),
        percentualGordura: percentualGordura.toFixed(2),
        peculiaridade: "O protocolo de campo mais rápido. Atenção: a combinação de dobras muda entre homens (PE, AB, CX) e mulheres (TR, SI, CX)."
    };
}

/**
 * Protocolo: Durnin & Womersley (4 Dobras)
 * Estima a Densidade Corporal a partir da Soma de 4 Dobras, Idade e Sexo.
 */
function calcularDurninWomersley(biceps, triceps, subescapular, supraIliaca, idade, sexo) {
    // Dobras Durnin & Womersley: Bíceps, Tríceps, Subescapular, Supra-Ilíaca
    const soma4Dobras = biceps + triceps + subescapular + supraIliaca;
    
    if (soma4Dobras === 0) {
        return { erro: "O Protocolo Durnin & Womersley exige as dobras Bíceps, Tríceps, Subescapular e Supra-Ilíaca." };
    }
    
    let C, M; // Constantes de regressão
    
    // 1. Determinar as constantes C e M com base no Sexo e na Idade
    if (sexo === 'masculino') {
        if (idade >= 17 && idade <= 19) { C = 1.1620; M = 0.0630; }
        else if (idade >= 20 && idade <= 29) { C = 1.1614; M = 0.0700; }
        else if (idade >= 30 && idade <= 39) { C = 1.1422; M = 0.0765; }
        else if (idade >= 40 && idade <= 49) { C = 1.1620; M = 0.0815; }
        else if (idade >= 50) { C = 1.1715; M = 0.0779; }
        else { 
            return { erro: "Idade fora do range válido (17-72 anos) para o protocolo Durnin & Womersley (Homens)." };
        }
    } else if (sexo === 'feminino') {
        if (idade >= 17 && idade <= 19) { C = 1.1549; M = 0.0678; }
        else if (idade >= 20 && idade <= 29) { C = 1.1631; M = 0.0734; }
        else if (idade >= 30 && idade <= 39) { C = 1.1422; M = 0.0765; } // Nota: mesmíssima constante dos 30-39 para homens
        else if (idade >= 40 && idade <= 49) { C = 1.1333; M = 0.0816; }
        else if (idade >= 50) { C = 1.1339; M = 0.0769; }
        else { 
            return { erro: "Idade fora do range válido (17-72 anos) para o protocolo Durnin & Womersley (Mulheres)." };
        }
    } else {
        return { erro: "Sexo não especificado para o cálculo Durnin & Womersley." };
    }
    
    const logSoma = Math.log10(soma4Dobras);
    
    // 2. Cálculo da Densidade Corporal: DC = C - (M * log10(Σ4))
    const dc = C - (M * logSoma);
    
    // 3. Cálculo do Percentual de Gordura (Fórmula de Siri)
    const percentualGordura = ((4.95 / dc) - 4.50) * 100;

    return {
        protocolo: "Durnin & Womersley (4 Dobras)",
        dobrasUtilizadas: `Bíceps (${biceps}mm) + Tríceps (${triceps}mm) + Subescapular (${subescapular}mm) + Supra-Ilíaca (${supraIliaca}mm)`,
        somaDobras: soma4Dobras.toFixed(2),
        densidadeCorporal: dc.toFixed(4),
        percentualGordura: percentualGordura.toFixed(2),
        peculiaridade: `Altamente dependente da faixa etária para o cálculo da Densidade Corporal. É preciso que a idade esteja entre 17 e 72 anos.`
    };
}

// =================================================================
// 5. FUNÇÕES DE UX E VALIDAÇÃO DE INPUTS
// =================================================================

function controlarInputsDobras() {
    const protocolo = document.getElementById('protocolo').value;
    const todosInputsDobras = document.querySelectorAll('.dobra-input');
    
    // 1. Desabilitar e Limpar todos os campos de dobras por padrão
    todosInputsDobras.forEach(input => {
        input.disabled = true;
        input.value = ''; // Limpa o valor anterior para evitar erros
    });

    let dobrasRequeridas = [];

    // 2. Definir as dobras necessárias para cada protocolo
    if (protocolo === 'jp7') {
        // JP7: Tríceps, Subescapular, Axilar Média, Peitoral, Abdominal, Supra-Ilíaca, Coxa
        dobrasRequeridas = ['triceps', 'subescapular', 'axilarMedia', 'peitoral', 'abdominal', 'supraIliaca', 'coxa'];
    } else if (protocolo === 'jp3') {
        // JP3: Varia por Sexo, mas precisamos de: Tríceps, Peitoral, Abdominal, Supra-Ilíaca, Coxa
        // O JS só habilita os campos, o cálculo valida quais são obrigatórios.
        dobrasRequeridas = ['triceps', 'peitoral', 'abdominal', 'supraIliaca', 'coxa'];
    } else if (protocolo === 'guedes') {
        // Guedes: Tríceps, Subescapular, Abdominal, Supra-Ilíaca, Coxa (depende do sexo)
        dobrasRequeridas = ['triceps', 'subescapular', 'abdominal', 'supraIliaca', 'coxa'];
    } else if (protocolo === 'durnin') {
        // Durnin: Bíceps, Tríceps, Subescapular, Supra-Ilíaca
        dobrasRequeridas = ['biceps', 'triceps', 'subescapular', 'supraIliaca'];
    }
    
    // 3. Habilitar os inputs necessários
    dobrasRequeridas.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.disabled = false;
        }
    });
}

// =================================================================
// 6. FUNÇÃO DE CLASSIFICAÇÃO DE RESULTADOS
// =================================================================

/**
 * Classifica o Percentual de Gordura com base em tabelas de referência (ACSM/J&P).
 */
function classificarPercentualGordura(percentualGordura, idade, sexo) {
    if (!sexo || !percentualGordura || percentualGordura <= 0) {
        return "Percentual de gordura não calculado ou inválido.";
    }

    const classificacoesSexo = CLASSIFICACAO_GORDURA[sexo];
    if (!classificacoesSexo) {
        return "Dados de classificação não encontrados para o sexo informado.";
    }

    // Determina a faixa etária
    let faixaEtaria;
    if (idade >= 20 && idade <= 29) {
        faixaEtaria = '20-29';
    } else if (idade >= 30 && idade <= 39) {
        faixaEtaria = '30-39';
    } else if (idade >= 40 && idade <= 49) {
        faixaEtaria = '40-49';
    } else if (idade >= 50) {
        faixaEtaria = '50+';
    } else {
        return `Idade (${idade}) fora do range de classificação (20+ anos).`;
    }

    // Busca a linha de classificação para a faixa etária
    const classificacao = classificacoesSexo.find(item => item.faixa === faixaEtaria);
    if (!classificacao) {
        return "Tabela de classificação indisponível para esta idade/sexo.";
    }

    // Aplica a lógica de classificação, do menor para o maior (mais rigoroso para o menos rigoroso)
    const categorias = classificacao.categorias;
    let status = "Muito Ruim (Obesidade)";

    // Importante: A ordem de checagem é do melhor (Atleta) para o pior (Ruim/Obesidade)
    if (percentualGordura <= categorias.Atleta) {
        status = "Atleta (Ideal)";
    } else if (percentualGordura <= categorias.Excelente) {
        status = "Excelente";
    } else if (percentualGordura <= categorias.Bom) {
        status = "Bom";
    } else if (percentualGordura <= categorias.Mediano) {
        status = "Mediano";
    } else if (percentualGordura <= categorias.Ruim) {
        status = "Ruim (Risco)";
    }
    
    return `${status} (Faixa Etária: ${faixaEtaria})`;
}

// =================================================================
// 7. FUNÇÃO DE EXPORTAÇÃO DE DADOS (CSV - MELHORADO PARA EXCEL BR)
// =================================================================

function exportarParaCSV(resultados) {
    
    // NOTA: Usamos o ponto e vírgula (;) como separador, padrão para Excel Brasil.
    const SEPARATOR = ';'; 
    
    // Objeto para garantir que todos os resultados numéricos usem VÍRGULA como separador decimal no CSV
    const formatarNumero = (valor) => {
        if (typeof valor === 'string') {
            valor = parseFloat(valor.replace(',', '.'));
        }
        if (isNaN(valor) || valor === null) {
            return 'N/A';
        }
        return valor.toFixed(4).replace('.', ','); // Troca ponto por vírgula para Excel
    };
    
    // 1. Definir o cabeçalho (Header) do CSV
    let csv = "Categoria" + SEPARATOR + "Metrica" + SEPARATOR + "Valor" + SEPARATOR + "Unidade" + SEPARATOR + "Status_Risco\n";

    // 2. Coletar Dados Essenciais (Gerais)
    csv += `Geral${SEPARATOR}Nome${SEPARATOR}"${resultados.nome}"${SEPARATOR}${SEPARATOR}\n`;
    csv += `Geral${SEPARATOR}Idade${SEPARATOR}${resultados.idade}${SEPARATOR}anos${SEPARATOR}\n`;
    csv += `Geral${SEPARATOR}Sexo${SEPARATOR}${resultados.sexo}${SEPARATOR}${SEPARATOR}\n`;
    csv += `Geral${SEPARATOR}Estatura${SEPARATOR}${formatarNumero(document.getElementById('estatura').value)}${SEPARATOR}cm${SEPARATOR}\n`;
    csv += `Geral${SEPARATOR}Peso${SEPARATOR}${formatarNumero(document.getElementById('peso').value)}${SEPARATOR}kg${SEPARATOR}\n`;
    csv += `Geral${SEPARATOR}Cintura${SEPARATOR}${formatarNumero(document.getElementById('cintura').value)}${SEPARATOR}cm${SEPARATOR}\n`;
    csv += `Geral${SEPARATOR}Quadril${SEPARATOR}${formatarNumero(document.getElementById('quadril').value)}${SEPARATOR}cm${SEPARATOR}\n`;
    csv += `Geral${SEPARATOR}Protocolo Selecionado${SEPARATOR}${document.getElementById('protocolo').value}${SEPARATOR}${SEPARATOR}\n`;

    // 3. Coletar Dobras Cutâneas Inseridas (com formatação de número)
    csv += `\nDobras Inseridas${SEPARATOR}---${SEPARATOR}---${SEPARATOR}---${SEPARATOR}---\n`;
    const dobras = ['triceps', 'biceps', 'subescapular', 'peitoral', 'axilarMedia', 'abdominal', 'supraIliaca', 'coxa'];
    dobras.forEach(id => {
        const valor = document.getElementById(id).value || "0";
        csv += `Dobras Inseridas${SEPARATOR}${id}${SEPARATOR}${formatarNumero(valor)}${SEPARATOR}mm${SEPARATOR}\n`;
    });

    // 4. Coletar Resultados de Composição Corporal
    csv += `\nResultados Cálculo${SEPARATOR}---${SEPARATOR}---${SEPARATOR}---${SEPARATOR}---\n`;
    if (resultados.dobras && !resultados.dobras.erro) {
        const percentualGordura = parseFloat(resultados.dobras.percentualGordura);
        const classificacaoGorduraCompleta = classificarPercentualGordura(percentualGordura, resultados.idade, resultados.sexo);
        
        csv += `Composicao Corporal${SEPARATOR}Protocolo Utilizado${SEPARATOR}${resultados.dobras.protocolo}${SEPARATOR}${SEPARATOR}\n`;
        csv += `Composicao Corporal${SEPARATOR}Percentual de Gordura Estimado${SEPARATOR}${formatarNumero(percentualGordura)}${SEPARATOR}%${SEPARATOR}${classificacaoGorduraCompleta}\n`;
        csv += `Composicao Corporal${SEPARATOR}Densidade Corporal${SEPARATOR}${formatarNumero(resultados.dobras.densidadeCorporal)}${SEPARATOR}g/mL${SEPARATOR}\n`;
    } else if (resultados.dobras && resultados.dobras.erro) {
         csv += `Composicao Corporal${SEPARATOR}Erro Protocolo Dobras${SEPARATOR}${resultados.dobras.erro}${SEPARATOR}${SEPARATOR}\n`;
    }
    
    // 5. Coletar Índices de Risco
    csv += `\nResultados Risco${SEPARATOR}---${SEPARATOR}---${SEPARATOR}---${SEPARATOR}---\n`;
    resultados.indices.forEach(indice => {
        // Para IMC/RCE/RCQ, o valor pode ser um número ou a própria string de status
        const valorCSV = indice.valor ? formatarNumero(indice.valor) : 'N/A'; 
        const statusCSV = indice.status.replace(/;/g, ','); // Garante que o status não quebre o CSV
        
        csv += `Risco Antropometrico${SEPARATOR}${indice.indice}${SEPARATOR}${valorCSV}${SEPARATOR}${SEPARATOR}${statusCSV}\n`;
    });

    
    // 6. Criar e Baixar o Arquivo

    // Adiciona o BOM para forçar o Excel a abrir com UTF-8 e reconhecer o ;
    const BOM = "\uFEFF"; 
    const finalCsv = BOM + csv;

    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    
    // Cria um link temporário para forçar o download
    const link = document.createElement("a");
    if (link.download !== undefined) { 
        const dataAtual = new Date().toISOString().slice(0, 10);
        const nomeArquivo = `Avaliacao_${resultados.nome.replace(/\s/g, '_')}_${dataAtual}.csv`;
        
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", nomeArquivo);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
// Inicialização: Desabilita todos os campos de dobras ao carregar a página
document.addEventListener('DOMContentLoaded', controlarInputsDobras);