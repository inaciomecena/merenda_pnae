export type ProdutoReferenciaSeed = {
  nome: string;
  unidadePadrao: string;
  categoria: string;
  palavrasChave?: string;
  sinonimos?: string;
};

export const PRODUTOS_EDITAL_ALTO_PARAGUAI: ProdutoReferenciaSeed[] = [
  ['Abacaxi pérola', 'KG', 'Frutas'], ['Abóbora cabotiá', 'KG', 'Hortaliças'],
  ['Abóbora paulista', 'KG', 'Hortaliças'], ['Açafrão', 'KG', 'Temperos'],
  ['Agrião', 'KG', 'Hortaliças'], ['Alface crespa', 'KG', 'Hortaliças'],
  ['Almeirão', 'KG', 'Hortaliças'], ['Banana-da-terra', 'KG', 'Frutas'],
  ['Banana nanica', 'KG', 'Frutas'], ['Batata-doce', 'KG', 'Hortaliças'],
  ['Bebida láctea fermentada sabor coco', 'KG', 'Laticínios'],
  ['Bebida láctea fermentada sabor morango', 'KG', 'Laticínios'],
  ['Beterraba', 'KG', 'Hortaliças'], ['Bolo de chocolate', 'KG', 'Panificados'],
  ['Bolo de coco', 'KG', 'Panificados'], ['Bolo de laranja', 'KG', 'Panificados'],
  ['Bolo simples', 'KG', 'Panificados'], ['Café torrado e moído', 'KG', 'Bebidas'],
  ['Carne bovina em cubos congelada - paleta sem osso', 'KG', 'Carnes'],
  ['Carne bovina em iscas congelada - acém', 'KG', 'Carnes'],
  ['Carne bovina moída congelada - músculo', 'KG', 'Carnes'],
  ['Cebolinha', 'KG', 'Temperos'], ['Cenoura', 'KG', 'Hortaliças'],
  ['Coentro', 'KG', 'Temperos'], ['Colorau', 'KG', 'Temperos'],
  ['Couve', 'KG', 'Hortaliças'], ['Doce de leite', 'KG', 'Laticínios'],
  ['Hortelã', 'KG', 'Temperos'], ['Farinha de mandioca', 'KG', 'Farináceos'],
  ['Laranja pera', 'KG', 'Frutas'], ['Leite pasteurizado integral', 'L', 'Laticínios'],
  ['Limão tahiti', 'KG', 'Frutas'], ['Mamão formosa', 'KG', 'Frutas'],
  ['Mandioca descascada congelada', 'KG', 'Hortaliças'], ['Manjericão', 'KG', 'Temperos'],
  ['Manteiga pura com sal', 'KG', 'Laticínios'], ['Melancia', 'KG', 'Frutas'],
  ['Melão', 'KG', 'Frutas'], ['Pão caseiro', 'KG', 'Panificados'],
  ['Filé de pintado congelado', 'KG', 'Pescados'],
  ['Filé de pintado congelado em pedaços', 'KG', 'Pescados'],
  ['Filé de tilápia congelado', 'KG', 'Pescados'], ['Pepino', 'KG', 'Hortaliças'],
  ['Pimenta-de-cheiro', 'KG', 'Temperos'], ['Pimentão verde', 'KG', 'Hortaliças'],
  ['Polpa de abacaxi', 'KG', 'Polpas de frutas'], ['Polpa de acerola', 'KG', 'Polpas de frutas'],
  ['Polpa de caju', 'KG', 'Polpas de frutas'], ['Polpa de maracujá', 'KG', 'Polpas de frutas'],
  ['Poncã', 'KG', 'Frutas'], ['Queijo muçarela', 'KG', 'Laticínios'],
  ['Repolho branco ou verde', 'KG', 'Hortaliças'], ['Requeijão cremoso', 'KG', 'Laticínios'],
  ['Rúcula', 'KG', 'Hortaliças'], ['Salsa', 'KG', 'Temperos'],
  ['Tomate salada', 'KG', 'Hortaliças'],
].map(([nome, unidadePadrao, categoria]) => ({
  nome,
  unidadePadrao,
  categoria,
  palavrasChave: nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
}));

export type DreSeed = {
  codigo: string;
  nome: string;
  municipioSede: string;
  fonte: string;
  escolas: string[];
};

const escolas = (value: string) => value.trim().split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

export const DRES_SEDUC_MT: DreSeed[] = [
  { codigo: 'ATF', nome: 'DRE Alta Floresta', municipioSede: 'Alta Floresta', fonte: 'https://www3.seduc.mt.gov.br/dre-alta-floresta', escolas: escolas(`
EE 19 de Maio
EE Boa Esperança
EE Cerejeiras
EE Cívico-Militar Cecília Meireles
EE Cívico-Militar Nova Canaã
EE Cívico-Militar Tancredo de Almeida Neves
EE Dom Bosco
EE Dr. Mário Corrêa da Costa
EE Frei Caneca
EE Indígena Itawyàk
EE Ivone Borkwski de Lima
EE Jardim Universitário
EE Jayme Veríssimo de Campos Júnior
EE João Paulo I
EE Ludovico da Riva Neto
EE Militar Dom Pedro II Ten. Cel. Evandro Dias de Souza
EE Mundo Novo
EE Nova União
EE Ouro Verde
EE Portal da Amazônia
EE Profª Marinês Fátima de Sá Teixeira
EE Profª Neide Enara Sima
EE Profº Valdomiro Teodoro Cândido
EE Rui Barbosa
EE São Pedro
EE Vinícius de Moraes`) },
  { codigo: 'BGA', nome: 'DRE Barra do Garças', municipioSede: 'Barra do Garças', fonte: 'https://www3.seduc.mt.gov.br/dre-barra-do-garcas', escolas: escolas(`
EE 9 de Julho
EE 20 de Março
EE Antônio Grohs
EE Antônio Nonato Rocha
EE Arthur da Costa e Silva
EE Cel. Jerônimo Gomes da Silva
EE Cel. Ondino Rodrigues Lima
EE Cívico-Militar 31 de Março
EE Cívico-Militar Alexandre Leite
EE Cívico-Militar Arlindo Estilac Leal
EE Cívico-Militar Profª Maria de Lourdes Hora Moraes
EE Cívico-Militar São Miguel
EE Cívico-Militar Sen. Filinto Muller
EE Coutinho União
EE Couto Magalhães
EE Diniz Alves de Toledo
EE Dr. João Ponce de Arruda
EE Francisco Dourado
EE Getúlio Vargas
EE Heronides Araújo
EE Indígena Aiha
EE Indígena Aldeiona
EE Indígena Butse Wawe
EE Indígena Constantino Tsererowê
EE Indígena David Ai'rero
EE Indígena Diauarun
EE Indígena Dom Felippó Rinaldi
EE Indígena Estrela
EE Indígena Etenhiritipa
EE Indígena Hambe
EE Indígena Ikpeng
EE Indígena Jucelino Tseremaa
EE Indígena Kisédje
EE Indígena Luiz Rudzane Edi Orebwe
EE Indígena Mário Juruna
EE Indígena Mavutsinin
EE Indígena Raí'rãte
EE Indígena Sagrado Coração de Jesus
EE Indígena Samuel Sahutuwe
EE Indígena Ulisses Guimarães
EE Indígena Wa Omora
EE Indígena Xavante
EE Irmã Diva Pimentel
EE Jaraguá
EE José Angelo dos Santos
EE José de Alencar
EE Juscelino Kubitschek Oliveira
EE Mal. Eurico Gaspar Dutra
EE Militar Dom Pedro II Dep. Norberto Schwantes
EE Militar Tiradentes 3º Sgt. PM Justino Pinheiro dos Santos
EE Militar Tiradentes CB PM Danner Maia Barbosa
EE Militar Tiradentes CB PM Sebastião Ferreira Miranda
EE Militar Tiradentes CB PM Vanilson Silva Carvalho
EE Militar Tiradentes Cel. PM Jorge Luiz de Magalhães
EE Min. João Alberto
EE Querência
EE São Domingos Sávio
EE Tancredo Neves`) },
  { codigo: 'CCR', nome: 'DRE Cáceres', municipioSede: 'Cáceres', fonte: 'https://www3.seduc.mt.gov.br/dre-caceres', escolas: escolas(`
EE 11 de Março
EE 12 de Outubro
EE 13 de Maio
EE 15 de Junho
EE Boa Esperança
EE Boa Vista
EE Cívico-Militar 12 de Outubro
EE Cívico-Militar Ana Maria das Graças de Souza Noronha
EE Cívico-Militar Frei Ambrósio
EE Cívico-Militar Miguel Barbosa
EE Cívico-Militar Nsa. Sra. de Fátima
EE Cívico-Militar Sen. Mário Motta
EE Dep. Bertoldo Freire
EE Dep. Francisco Eduardo Rangel Torres
EE Dep. Francisco Villanova
EE Indígena Chiquitano José Turíbio
EE João de Campos Widal
EE João Sato
EE José Bejo
EE Leopoldo Ambrósio Filho
EE Lourenço Peruchi
EE Madre Cristina
EE Militar Tiradentes Profº Natalino Ferreira Mendes
EE Padre José Anchieta
EE Padre Tiago
EE Paulino Modesto
EE Pedro Galhardo Garcia
EE Pres. Tancredo de Almeida Neves
EE Profº Demétrio Costa Pereira
EE Profº João Florentino Silva Neto
EE Profº Milton Marques Curvo
EE Santa Rosa
EE São Geraldo
EE São Luiz`) },
  { codigo: 'CFS', nome: 'DRE Confresa', municipioSede: 'Confresa', fonte: 'https://www3.seduc.mt.gov.br/dre-confresa', escolas: escolas(`
EE 5 de Abril
EE 29 de Setembro
EE Alexandre Quirino Souza
EE Antônia Leão dos Santos
EE Antônio Alves Dias
EE Antônio Carlos Moura
EE Antônio Gomes Primo
EE Cívico-Militar 13 de Maio
EE Cívico-Militar 29 de Julho
EE Cívico-Militar Profª Hilda Rocha Souza
EE Creuslhi de Souza Ramos
EE de Santa Cruz
EE Elias Bento
EE Indígena Bepkororoti
EE Indígena Bitahama
EE Indígena Hadori
EE Indígena Hawalora
EE Indígena Itxalá
EE Indígena Maraiwatsede
EE Indígena Tapi'itãwa
EE Indígena Tapirape
EE João Rezende de Azevedo
EE José Gonçalves dos Santos
EE Juscelino Kubistchek
EE Maria Esther Peres
EE Militar Tiradentes CB PM José Martins de Moura
EE Militar Tiradentes SD PM Antônio Eustáquio de Paula
EE Pres. Tancredo de Almeida Neves
EE Profº Gerson Carlos da Silva
EE Roberval Costa Reis
EE Santa Terezinha
EE Severiano Neves
EE Sol Nascente
EE Teotônio Carlos da Cunha Neto
EE Waldir Bento da Costa`) },
  { codigo: 'DMT', nome: 'DRE Diamantino', municipioSede: 'Diamantino', fonte: 'https://www3.seduc.mt.gov.br/dre-diamantino', escolas: escolas(`
EE Acadêmico Lauro Augusto de Barros
EE Água Santa
EE Alexandre Gomes Silva Chaves
EE Alfredo de Araújo Granja
EE Ana Maria Tissiani de Oliveira
EE Benedita de Almeida
EE Castro Alves
EE Cel. Artur Borges
EE Cívico-Militar Cândido Portinari
EE Cívico-Militar Dr. Anísio José Moreira
EE Cívico-Militar Gov. João Ponce de Arruda
EE Cívico-Militar Inocência Rachid Jaudy
EE Cívico-Militar Irmã Lucinda Facchini
EE Cívico-Militar João Batista de Almeida
EE Cívico-Militar José Aparecido Ribeiro
EE Cívico-Militar Osmair Pinheiro da Silva
EE Cívico-Militar Profº João Calixto Bernardes
EE Cívico-Militar Profª Muralha de Miranda Passos
EE Cívico-Militar Rui Barbosa
EE Cívico-Militar Virgílio Corrêa Filho
EE Décio Luiz Furigo
EE Des. Olegário Moreira de Barros
EE Dr. Arnaldo Estevão de Figueiredo
EE Dr. Fábio Silvério de Farias
EE Estevão Pereira de Almeida
EE Geraldo Santana dos Santos
EE Henrique José Trindade
EE Idalina de Farias
EE Mal. Cândido Rondon
EE Mal. Rondon
EE Militar Tiradentes Cel. PM Celso Henrique Souza Barbosa
EE Militar Tiradentes Dr. Manoel José Murtinho
EE Nilce Maria de Magalhães
EE Padre Jhoannes Berthold Henning
EE Plácido de Castro
EE Profª Elizabet Evangelista Pereira
EE Profª Zélia Costa de Almeida
EE Profº Nilo Póvoas
EE Santana D'água Limpa
EE São José do Rio Claro
EE Sen. Filinto Muller
EE Serra Azul`) },
  { codigo: 'JNA', nome: 'DRE Juína', municipioSede: 'Juína', fonte: 'https://www3.seduc.mt.gov.br/dre-juina', escolas: escolas(`
EE Ana Neri
EE André Antônio Maggi
EE Antônio Francisco Lisboa
EE Bernardino Gomes da Luz
EE Cecília de Castro Barbosa
EE Cívico-Militar 7 de Setembro
EE Cívico-Militar Antônia Moura Muniz
EE Cívico-Militar Comendador José Pedro Dias
EE Cívico-Militar de Tempo Integral 21 de Abril
EE Cívico-Militar de Tempo Integral Profº Elidio Murcelli Filho
EE Cívico-Militar Dom Aquino Corrêa
EE Cívico-Militar Dr. Artur Antunes Maciel
EE Cívico-Militar José Alves Bezerra
EE Cívico-Militar José Dias
EE Cívico-Militar Maria da Glória Vargas Ochoa
EE Cívico-Militar Maria Quitéria
EE Cívico-Militar Nivaldo Fracarolli
EE Cívico-Militar Profª Norma Lúcia Nunes
EE Cívico-Militar Rosmay Kara José
EE Cívico-Militar São Francisco de Assis
EE de Tempo Integral Daury Riva
EE de Tempo Integral Vocacionada à Tecnologia Aline Maria Teixeira
EE Dom Aquino Corrêa
EE Dom Franco Dalla Valle
EE Ewaldo Meyer Roderjan
EE Indígena Adeca Vela Arara
EE Indígena Enawenê Nawê
EE Indígena Eterepuiy
EE Indígena Juporijup
EE Indígena Krixi Barompo
EE Indígena Leonardo Crixi Apiaka
EE Indígena Myhyinymykyta Skiripi
EE Indígena Pasapkareej
EE Indígena Pé de Mutum
EE Indígena Tapurá Irantxe
EE Indígena Xinui Myky
EE José Cleto Giehl
EE Maria Miranda Araújo
EE Mário de Andrade
EE Militar Tiradentes 3º Sgt. PM Eduardo Luiz de Souza
EE Militar Tiradentes CB PM Israel Wesley Prado de Almeida
EE Militar Tiradentes Pe. Ezequiel Ramin
EE Oscar Soares
EE Paulo Freire
EE Pedro Borges
EE Renato Spinelli
EE Sidney Cesar Fuhr
EE Tarsila do Amaral`) },
  { codigo: 'MTP', nome: 'DRE Matupá', municipioSede: 'Matupá', fonte: 'https://www3.seduc.mt.gov.br/dre-matupa', escolas: escolas(`
EE 12 de Abril
EE 13 de Maio
EE 19 de Julho
EE André Antônio Maggi
EE Antônio Ometto
EE Bairro União
EE Cívico-Militar Albert Einstein
EE Cívico-Militar Jardim das Flores
EE Guarantã
EE Indígena Elio Turi Rondon Terena
EE Indígena Goronã
EE Indígena Kamadu
EE Indígena Metuktire
EE Indígena Panaku
EE Indígena Terena de Komomoyea Kovôero
EE Irany Jaime Farina
EE Kreen Akarore
EE Leonísio Lemos Melo
EE Lucas Auxílio Toniazzo
EE Luciene Cardoso de Oliveira
EE Militar Tiradentes 2º Sgt. PM Luciano José Queiroz
EE Paulo Freire
EE Pedro Bianchini
EE Profº Elcio Prates
EE Sen. Jonas Pinheiro
EE Terra Nova`) },
  { codigo: 'CBA', nome: 'DRE Metropolitana', municipioSede: 'Cuiabá', fonte: 'https://www3.seduc.mt.gov.br/dre-cuiaba', escolas: escolas(`
CEAADA Profª Arlete Pereira Migueletti
CHP Profª Célia Rodrigues Duque
EE Alina do Nascimento Tocantins
EE Alvarina Alves de Freitas
EE Antônio Cesário de Figueiredo Neto
EE Antônio Garcia
EE Antônio João Ribeiro de Arruda
EE Arlete Maria da Silva
EE Arnaldo Estevão de Figueiredo
EE Aureolina Eustacia Ribeiro
EE Bel. Ribeiro de Arruda
EE Benedita Augusta Lemes
EE Cel. Antônio Pais de Barros
EE Cel. Rafael de Siqueira
EE Cívico-Militar Alcebíades Calhão
EE Cívico-Militar André Avelino Ribeiro
EE Cívico-Militar Dr. Estevão Alves Corrêa
EE Cívico-Militar Dr. Helio Palma de Arruda
EE Cívico-Militar Ernandy Maurício Baracat
EE Cívico-Militar Filogônio Corrêa
EE Cívico-Militar Gustavo Kulman
EE Cívico-Militar Heliodoro Capistrano
EE Cívico-Militar Historiador Rubens de Mendonça
EE Cívico-Militar Irene Gomes de Campos
EE Cívico-Militar João Brienne de Camargo
EE Cívico-Militar José de Barros Maciel
EE Cívico-Militar Juarez Rodrigues dos Anjos
EE Cívico-Militar Leônidas Antero de Matos
EE Cívico-Militar Leônidas de Matos
EE Cívico-Militar Leovegildo de Melo
EE Cívico-Militar Malik Didier Namer Zahafi
EE Cívico-Militar Mário de Castro
EE Cívico-Militar Miguel Baracat
EE Cívico-Militar Pe. Wanir Delfino César
EE Cívico-Militar Profª Ana Maria do Couto
EE Cívico-Militar Profª Ana Tereza Albernaz
EE Cívico-Militar Profª Eliane Digigov Santana
EE Cívico-Militar Profª Elmaz Gattas Monteiro
EE Cívico-Militar Profª Eucaris Nunes Cunha Morais
EE Cívico-Militar Profª Maria Herminia Alves
EE Cívico-Militar Profª Zélia Costa de Almeida
EE Cívico-Militar Profº João Crisóstomo de Figueiredo
EE Cívico-Militar Profº Ulisses Cuiabano
EE Cívico-Militar Salim Felício
EE Cívico-Militar Salim Nadaf
EE Cívico-Militar Sen. Azeredo
EE Cívico-Militar Vanil Stabilito
EE Cívico-Militar Victorino Monteiro da Silva
EE Cleinia Rosalina de Souza
EE Damião Mamedes do Nascimento
EE da Policia Militar Tiradentes
EE de Ensino Especial Livre Aprender
EE de Ensino Especial Luz do Saber
EE Dep. Emanuel Pinheiro
EE Dep. Gonçalo Botelho de Campos
EE Dep. Ubaldo Monteiro da Silva
EE Djalma Ferreira de Souza
EE Dom Antonio Campelo
EE Dom Bosco
EE Dom Francisco de Aquino Corrêa
EE Domingos Sávio Brandão Lima
EE Dunga Rodrigues
EE Faustino Dias de Amorim
EE Feliciano Galdino
EE Francisco Ferreira Mendes
EE Frei Carlos Valette
EE Frei Emiliano Monteiro
EE Gov. Dante Martins de Oliveira
EE Gov. José Fragelli
EE Gov. José Garcia Neto
EE Hermelinda de Figueiredo
EE Hermes Rodrigues de Alcântara
EE Indígena Koge Eiari
EE Indígena Korogedo Paru
EE Indígena Piebaga
EE Irmãos do Caminho
EE Jaime Veríssimo de Campos Júnior Jaiminho
EE José de Lima Barros
EE José de Mesquita
EE José Leite de Moraes
EE Júlio Strubing Muller
EE Liceu Cuiabano Maria de Arruda Muller
EE Luiza Soares Boabaid
EE Manoel Cavalcante Proença
EE Manoel Gomes
EE Marcelina de Campos
EE Maria de Arruda Muller
EE Militar Dom Pedro II Pres. Médici
EE Militar Tiradentes Ten. Cel. PM Louirson Rodrigues Benevides
EE Milton Figueiredo
EE Nagib Saad
EE Oswaldita Eliza Teixeira Couto
EE Padre Ernesto Camilo Barreto
EE Padre Firmo Pinto Duarte Filho
EE Padre João Panarotto
EE Pe. José Maria do Sacramento
EE Pascoal Moreira Cabral
EE Pedro Gardés
EE Pio Machado
EE Ponce de Arruda
EE Porfíria Paula de Campos
EE Profª Adalgisa de Barros
EE Profª Alice Fontes Pinheiro
EE Profª Almira de Amorim Silva
EE Profª Cezina Antônia Botelho
EE Profª Dione Augusta Silva Souza
EE Profª Diva Hugueney de Siqueira Bastos
EE Profª Elizabeth Maria Bastos Mineiro
EE Profª Maria da Cunha Bruno
EE Profª Maria de Macedo Rodrigues
EE Profª Maria Helena de Araujo Bastos
EE Profª Maria Leite Marcoski
EE Profª Maria Silvina Peixoto de Moura
EE Profª Mariana Luiza Moreira
EE Profª Marlene Marques de Barros
EE Profª Paciana Torres de Sant'ana
EE Profª Agenor Ferreira Leão
EE Profº Antônio Epaminondas
EE Profº Arlindo de Souza Bruno
EE Profº Benedito de Carvalho
EE Profº Fernando Leite de Campos
EE Profº Honório Rodrigues Amorim
EE Profº Jercy Jacob
EE Profº José Mendes Martins
EE Profº Rafael Rueda
EE Profº Welson Mesquita de Oliveira
EE Raimundo Pinheiro da Silva
EE Raio de Sol
EE Reunidas de Cachoeira Rica
EE Rodolfo Augusto Trechaud Curvo
EE Santa Claudina
EE Santana do Taquaral
EE Santos Dumont
EE São José
EE Souza Bandeira
EE Tancredo de Almeida Neves
EE Tereza Conceição de Arruda
EE Ver. Amarílio Gomes da Silva`) },
  { codigo: 'PLA', nome: 'DRE Pontes e Lacerda', municipioSede: 'Pontes e Lacerda', fonte: 'https://www3.seduc.mt.gov.br/dre-pontes-e-lacerda', escolas: escolas(`
EE Barão de Melgaço
EE Cívico-Militar Angelina Franciscon Mazutti
EE Cívico-Militar Mário Spinelli
EE Conquista D'Oeste
EE Cora Coralina
EE Dep. Dormevil Faria
EE Dep. João Evaristo Curvo
EE do Campo 11 de Agosto
EE do Campo Dep. Djalma Carneiro da Rocha
EE do Campo Juscelino Kubitschek de Oliveira
EE do Campo Rainha da Paz
EE Dona Rosa Friger Piovezan
EE Hermes José da Silva
EE Indígena Mamainde
EE Indígena Pirineus de Souza
EE Indígena Sertanista Apoena Meirelles
EE Indígena Zarup Wej
EE Indígena Zawã Karej Pangyjej
EE Militar Tiradentes 1º Ten. PM Carlos Henrique Paschoiotto Scheifer
EE Olavo Bilac
EE Quilombola Verena Leite de Brito
EE São José`) },
  { codigo: 'PVL', nome: 'DRE Primavera do Leste', municipioSede: 'Primavera do Leste', fonte: 'https://www3.seduc.mt.gov.br/dre-primavera-do-leste', escolas: escolas(`
EE Apolônio Bouret de Melo
EE Argemiro Rodrigues Pimentel
EE Boa Esperança
EE Campo Massapé
EE Campo Vila União
EE Cívico-Militar 29 de Junho
EE Cívico-Militar Profª Alda Gawlinsk Scopel
EE Cívico-Militar Cremilda de Oliveira Viana
EE Cívico-Militar João Pedro Torres
EE Cívico-Militar Jupiara
EE Cívico-Militar Paulo Freire
EE Cívico-Militar Sebastião Patrício
EE Cívico-Militar Ulisses Guimarães
EE Franklin Cassiano
EE Gervásio dos Santos Costa
EE Getúlio Dornelles Vargas
EE Gustavo Dutra
EE Indígena Adão Toptiro
EE Indígena Aturua
EE Indígena Karib Comunidade Kuikuro
EE Indígena Kurâ-Bakairi
EE Indígena Leonardo Villas-Bôas
EE Indígena Marimbú
EE Indígena Paihitwara
EE Indígena Piyulaga
EE Indígena São José Sangradouro
EE João Borges Vieira
EE João Ribeiro Vilela
EE Ledy Anita Brescancin
EE Militar Tiradentes 2° Sgt. PM Weliton Pereira Duarte
EE Monteiro Lobato
EE Osvaldo Cândido Pereira
EE Padre César Albisetti
EE Poxoréo
EE Presidente Dutra
EE Profª Alice Barbosa Pacheco
EE Profª Juracy Macedo
EE Profª Maria Sebastiana de Souza
EE Vanderlei Cecatto
EE Waldemon Moraes Coelho`) },
  { codigo: 'ROO', nome: 'DRE Rondonópolis', municipioSede: 'Rondonópolis', fonte: 'https://www3.seduc.mt.gov.br/dre-rondonopolis', escolas: escolas(`
EE 7 de Setembro
EE Adolfo Augusto de Moraes
EE Arlinda Pessoa Morbeck
EE Celestino Corrêa da Costa
EE Cívico-Militar Antônio José de Lima
EE Cívico-Militar Bonifácio Sachetti
EE Cívico-Militar Carlos Irigaray Filho
EE Cívico-Militar de Tempo Integral Antônio Ferreira Sobrinho
EE Cívico-Militar de Tempo Integral Carlos Hugueney
EE Cívico-Militar de Tempo Integral João Matheus Barbosa
EE Cívico-Militar de Tempo Integral José Salmen Hanze
EE Cívico-Militar de Tempo Integral Lucas Pacheco de Camargo
EE Cívico-Militar de Tempo Integral Profª Stela Maris Valeriano da Silva
EE Cívico-Militar de Tempo Integral Silvestre Gomes Jardim
EE Cívico-Militar de Tempo Integral Treze de Maio
EE Cívico-Militar de Tempo Integral Vinícius de Moraes
EE Cívico-Militar Dez de Dezembro
EE Cívico-Militar Dom Aquino Corrêa
EE Cívico-Militar Dom Vunibaldo
EE Cívico-Militar Dona Maria de Lourdes Ribeiro Fragelli
EE Cívico-Militar Dr. Ytrio Corrêa
EE Cívico-Militar Emanuel Pinheiro
EE Cívico-Militar Francisca Barros de Carvalho
EE Cívico-Militar Irmã Miguelina Corso
EE Cívico-Militar Joaquim Nunes Rocha
EE Cívico-Militar José Moraes
EE Cívico-Militar Ludovico Vieira Camargo
EE Cívico-Militar Marechal Dutra
EE Cívico-Militar Maria de Lima Cadide
EE Cívico-Militar Milton da Costa Ferreira
EE Cívico-Militar Pindorama
EE Cívico-Militar Pref. Artur Ramos
EE Cívico-Militar Profª Alzira da Silva Santos
EE Cívico-Militar Profª Amélia de Oliveira Silva
EE Cívico-Militar Profª Edith Pereira Barbosa
EE Cívico-Militar Profª Elizabeth de Freitas Magalhães
EE Cívico-Militar Profª Eunice Souza dos Santos
EE Cívico-Militar Profª Maria Elza Ferreira Inácio
EE Cívico-Militar Profº Domingos Aparecido dos Santos
EE Cívico-Militar Ramiro Bernardo da Silva
EE Cívico-Militar São Pedro Apóstolo
EE Cívico-Militar XV de Outubro
EE Daniel Martins Moura
EE Dep. Oscar Soares
EE José Rodrigues dos Santos
EE La Salle
EE Major Otávio Pitaluga
EE Maria Auxiliadora
EE Militar Dom Pedro II André Antônio Maggi
EE Militar Tiradentes Maj. PM Ernestino Veríssimo da Silva
EE Militar Tiradentes Modelo Santo Antônio
EE Onecidio Manoel de Resende
EE Pedro Ferreira
EE Rui Barbosa
EE Sagrado Coração de Jesus
EE Santa Teresinha
EE Santo Antônio
EE São Francisco
EE São José Operário
EE São Lourenço`) },
  { codigo: 'SNP', nome: 'DRE Sinop', municipioSede: 'Sinop', fonte: 'https://www3.seduc.mt.gov.br/dre-sinop', escolas: escolas(`
EE 19 de Dezembro
EE Alfredo Treuherz
EE André Antônio Maggi - Colíder
EE André Antônio Maggi - Feliz Natal
EE André Antônio Maggi - Ipiranga do Norte
EE Benedito Santana da Silva Freire
EE Bom Jardim
EE Bromildo Lawisch
EE Cafenorte
EE Cândido Portinari
EE Carlos Drummond de Andrade
EE Cívico-Militar 13 de Maio
EE Cívico-Militar Angelo Nadin
EE Cívico-Militar Arão Gomes Bezerra
EE Cívico-Militar Arlete Maria Cappellari
EE Cívico-Militar Cleufa Hubner
EE Cívico-Militar Ênio Pipino
EE Cívico-Militar Manoel de Barros
EE Cívico-Militar Nossa Senhora da Glória
EE Cívico-Militar Nossa Senhora de Lourdes
EE Cívico-Militar Nossa Senhora do Perpétuo Socorro
EE Cívico-Militar Olímpio João Pissinatti Guerra
EE Cristiano Araújo Pires
EE Des. Milton Armando Pompeu de Barros
EE Dom Bosco
EE Dorothy Stang
EE Florestan Fernandes
EE Francisco Saldanha Neto
EE Grácia Edmundo Zeferino
EE Ignácio Schevinski Filho
EE Indígena Ikpeng
EE Indígena Mayrowi Apiaka
EE Ivaldino Francio
EE Jorge Amado
EE José Domingos Fraga
EE Manoel Soares Campos
EE Márcio Schabatt Souza
EE Mário Spinelli
EE Militar Dom Pedro II 2º Ten. BM Kleiber Rodrigues Alves
EE Militar Tiradentes 2º Sgt. PM Claudemir França Maciel
EE Militar Tiradentes CB Antônio Dilceu da Silva Amaral
EE Militar Tiradentes SD PM Adriana Morais Ramos
EE Nilza de Oliveira Pipino
EE Nossa Senhora Aparecida
EE Nova Galiléia
EE Palmital
EE Papa João Paulo II
EE Paulo Freire
EE Pedro Barbosa
EE Profª Alzira Maria da Silva
EE Profª Edeli Mantovani
EE Profª Maria de Fátima Gimenez Lopes
EE Profª Zeni Vieira
EE Profª Zuleide dos Santos Barros
EE Profº Djalma Guilherme da Silva
EE Renee Menezes
EE Rosa dos Ventos
EE São Vicente de Paula`) },
  { codigo: 'TGA', nome: 'DRE Tangará da Serra', municipioSede: 'Tangará da Serra', fonte: 'https://www3.seduc.mt.gov.br/dre-tangara-da-serra', escolas: escolas(`
EE 7 de Setembro
EE Antônio Hortollani
EE Argeu Augusto de Moraes
EE Cívico-Militar 13 de Maio
EE Cívico-Militar 29 de Novembro
EE Cívico-Militar Alfredo José da Silva
EE Cívico-Militar André Antônio Maggi
EE Cívico-Militar Dr. Joaquim Augusto da Costa Marques
EE Cívico-Militar João de Campos Borges
EE Cívico-Militar João Monteiro Sobrinho
EE Cívico-Militar Júlio Muller
EE Cívico-Militar Luiz Frutuoso da Silva
EE Cívico-Militar Madre Tarcila
EE Cívico-Militar Parecis
EE Cívico-Militar Pedro Alberto Tayano
EE Cívico-Militar Profª Francisca de Souza Alencar
EE Cívico-Militar Profª Jada Torres
EE Cívico-Militar Profº João Batista
EE Cívico-Militar Regina Tenório de Oliveira
EE Cívico-Militar Ver. Bento Muniz
EE Cívico-Militar Ver. Manoel Marinheiro
EE Cívico-Militar Ver. Ramon Sanches Marques
EE Cívico-Militar Wilson de Almeida
EE Indígena Jula Paré
EE Indígena Malamalali
EE Jonas Lopes da Silva
EE Marechal Cândido Rondon
EE Militar Tiradentes 1º Ten. PM Salomão Fernandes Ferreira Piovesan
EE Min. Petrônio Portella Nunes
EE Pe. Arlindo Ignácio de Oliveira
EE Patriarca da Independência
EE Paulo Freire
EE Profª Julieta Xavier Borges
EE Reinaldo Dutra Vilarinho
EE Sabino Ferreira Maia
EE Sagrado Coração de Jesus
EE União da Chapada`) },
];
