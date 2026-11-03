// pt grammar pools for "Make it memorable": N noun, V verb with an object, S verb on its own,
// A adjective (ES/PT: masculine|feminine), F feminine nouns. Built by tools/words/picture.py.
(window.ASP_MEMO = window.ASP_MEMO || {}).pt = {
  order: {"2": "NS", "3": "NAS", "4": "NAVN", "5": "NAVNA"},
  plain: {"3": "NVN"},
  N: `
abacate abacaxi abajur abano abelha abeto abridor abrigo academia acelga acerola adega adesivo adubo agenda agulha aipim alarme alavanca albatroz
alce aldeia alecrim alface alfajor alfinete alga algema alho alicate almofada alpaca ameba ameixa amendoim ametista amora anchova anel angu
anjo antena anzol apostila aquarela aqueduto aranha arara arbusto arco arenque argola ariranha armadura arroz asa aspargo assoalho atabaque ator
atriz atum avental azeitona azulejo babador bacalhau bacia bacon bagre baguete balaio balde baleia balsa bambu banana banco bandana bandeira
bandeja bandolim banheira banheiro banjo banqueta bar baralho barata barba barbante barbeiro barca barco barraca barranco barriga barril basquete batata
bateria batom bazar beijinho beijo beliche bengala berimbau bermuda besouro bexiga bezerro bica bichinho bico bife bigode bigorna bike bilha
bilhete bingo biombo biscoito bisnaga bisturi blazer bloco blusa blusinha bobina boca bochecha bode boi boia boina bola bolacha bolha
bolinha bolinho bolo bolota bolsa bolsinha bolso bombeiro bombom bonde bondinho boneca boneco bongo borbulha borracha bosque bota bote botina
botinha boto brasa brinco brioche broa broca broche brownie bruxa bruxo bueiro bule bumbo buraco busto buzina cabana cabelo cabide
cabine cabo cabra cabresto cabrito cacau cachecol cacho cachorro cacto cadeado cadeira caderno caiaque cais caixa caixinha caixote cajado caju
cajueiro calango calda caldinho caldo calzone cama camelo camisa camiseta camisola cana caneca canela caneta canguru canil canivete canoa cantil
cantor cantora canudo capa capacete capela capivara capuz caqui caracol caramelo caramujo carimbo carne carneiro carpa carreta carretel carrinho carro
carta cartaz carteira carteiro cartola carvalho casa casaco cascavel casinha castanha castelo castor casulo catraca cavala cavalo caverna cebola cedro
cegonha celeiro celular cenoura centauro cerca cereja cervo cesta cestinha cesto cetro chacal chafariz chaleira chama charrete chave chaveiro chiclete
chicote chifre chinelo chocalho choupana chuchu chupeta chuteira chuva chuveiro cigarra cinema cinto cinzeiro circo cisne coador coala cobertor cobra
cobrinha cocada coco codorna coelha coelho cofre cofrinho cogumelo coiote colar colcha coleira colete colher colina colmeia colo cometa comida
compasso cone confete cookie copinho copo coque coqueiro coracao coral corda cordeiro corneta coroa corpo correia corrente cortina coruja corvina
corvo costela cotonete cotovelo couve coxa coxinha cozinha cratera cravo creme crepe cristal cruz cubo cupido curativo cuscuz dado dardo
dedal dedo degrau dente dentista desenho deserto dia diamante dingo dinheiro disco doca doce docinho donut dourada drone ducha duende
duna dvd eclipse edredom elefante elevador elfo elmo ema empada empanada enguia envelope enxada erva ervilha escada escola escova escudo
esmalte espada espelho espeto espinha espinho espiral esponja esposa esposo espuma esquadro esqui esquilo estaca estante esteira estilete estojo estrada
estrela etiqueta euro extintor fada fagote faia faixa fantasia fantasma fantoche farda fardo farinha farofa farol farpa fatia fazenda feira
feltro feno ferro ferrolho festa ficha figo figueira figurino fila filha filho filhote filme filtro fio fita fivela flamingo flanela
flauta flecha floco flor floresta foca focinho fogo fogueira foguete foice folha folheto fone fonte formiga forno foto fralda franga
frango frasco freio freira freixo fronha fruta fruteira fungo funil furador fusca futebol gaiola gaita gaivota galho galinha galinho galo
galocha gancho gangorra ganso garagem garfo garganta garota garoto garoupa garra garrafa gata gatinho gato gaveta gazela gecko gel gelatina
geleia gelo gema gengibre gengiva gesso gibi gigante gilete girafa girassol girino giz glitter globo gnomo goblin goela goiaba goiabada
gol gola goleiro golfinho gongo gorila gorro gota goteira gotinha gouda grade gradil grafite gralha grama grampo granola gravador gravata
graveto graviola grelha grilo groselha gruta gude guepardo guincho guitarra halter hamster harpa headset hiena holofote homem horta hotel iate
idosa idoso iglu iguana ilha ilhota inalador ingresso inhame inseto iogurte isca isopor isqueiro jabuti jaca jaleco janela jangada jaqueta
jararaca jardim jarra jarro jasmim jato jaula javali jiboia jipe joaninha joelho jornal juba jujuba ketchup kibe kiwi ladeira lagarta
lagarto lago lagoa lagoinha lagosta lama lambari lancha lanche lanterna laranja lareira lasanha lasca lata latinha lavadora lebre legume leite
leiteira lenha lente lentilha leoa leopardo leque lesma lhama lichia lima limoeiro limonada lince linguado linha litro livraria livreto livro
lixa lixeira lixo lobo loja lombada lombriga lona lontra losango lousa lua lula luneta lupa lustre luva luz maca machado
madeira madrinha maestro mago maionese mala maleta malinha malote mamute mandioca manga manivela manta manteiga mapa mar maraca mariposa marisco
marmita marreco marreta martelo mascote medalha medusa meia mel melancia melro menina menino mercado mesa mesinha meteoro mexerica mico migalha
milho mingau minhoca mirtilo mocassim mochila moeda moedinha moedor moela moinho moita moldura moletom molho molusco monge monitor monstro montanha
moranga morango morcego mordedor moringa morro morsa mosaico mosca mosquito mostarda moto motoca motor mouse mousse muffin mula muleta mulher
mural muralha muro museu musgo nabo nadador naja namorada namorado nariz nave navio neblina nervo neta neto neve nhoque ninho
ninja nogueira noiva noivo notebook novelo noz nuvem obelisco oca ocarina oceano oficina ogro olho oliva oliveira olmo ombro omelete
onda orca orelha origami osso ostra ouro ouvido ovelha ovinho ovo paca pacote pacu padaria padeiro padrinho pai painel palanque
palco paleta palha palito palma palmeira palmito pamonha panda pandeiro panela panfleto paninho pano panqueca pantera pantufa papagaio papai papel
papinha papoula parafuso pardal parede parque pasta pastel pastilha pata patinete patinho pato pavio pecinha pedal pedra pedrinha peixe peixinho
pele pelicano pelota pendrive peneira penhasco penico pente pepino pera perdiz pereira perfume perna persiana peru perua peruca pescada pescador
pestana peteca petisco pia piano picape picareta picles pico pier pijama pilar pilha piloto pimenta pincel pingente pingo pinguim pinha
pinheiro pino pintinho pintor pintora pintura piolho pipa pipoca pirarucu pirata pires piscina piso pistache pitanga pizza pizzaria placa placar
planador planeta planta pluma pneu pochete pocilga poleiro polenta poltrona polvo pomar pomba pombo pompom poncho ponte ponteiro porco porrete
porta portal porteira porto poste pote potinho potro pousada prado praia prancha prata pratinho prato pregador prego presente presilha presunto
pretzel prima primo princesa projetor pua pudim pufe pulga pulseira pulso puma punho pupila puxador quadrado quadro quarto quati queijo
queixo queque quiabo quibe quilha quindim quintal quiosque rabanete rabeca radar radiador raia rainha raio raiz ralador ralo ramo rampa
rapadura raposa raquete rato ravioli recibo rede redinha regador regata rei remo rena repolho represa retrato revista riacho ribeiro rio
riozinho ripa risoto rocha roda rodinha roleta rolete rolha rosa rosto roupa roupeiro rouxinol rua rubi sabonete sacola safira sagui
saia sal sala salada salame salgado salsa salsicha salsinha samba sanfona sapato sapinho sapo sardinha sauna saveiro saxofone secador secadora
sela selo semente sereia seringa serpente serra serrote seta shampoo sino sirene siri siso skate sogra sogro soja sol soldado
solha sopa sopinha soprador sorriso sorvete suco sucuri sunga surf suricato suspiro tablet tacho taco talha talo tamanco tamara tambor
tampa tampinha tanque tapete tapioca taquara tatame tatu tear teatro tecla teclado teia teixo tela telefone telha telhado tenaz tenda
terno terra tesoura testa teto tia tiara tigela tigre tijolo tinta tio titia titio toalha tocha tomada tomate tonel tora
tornado torneira torno torrada torre torta tortilha touca toupeira touro trator trem trevo triciclo trigo tromba trombeta trombone trompa trompete
tronco trono trufa truta tsunami tuba tubo tucano tulipa turbante ukulele umbigo unha urso urubu uva vaca vagalume varal varanda
vareta varinha vaso vassoura veia vela velcro veleiro veludo venda vento ventosa verde verdura verme vermelho verruga vespa veste vestido
viaduto videira vidro viga vila vinagre vinil viola violeta violino viseira vitrine viveiro vizinha vizinho volante voo voz wafer webcam
wok xadrez xale xampu xarope xilofone zebra zepelim zumbi
`,
  F: `
abelha academia acelga acerola adega agenda agulha alavanca aldeia alface alga algema almofada alpaca ameba ameixa ametista amora anchova antena
apostila aquarela aranha arara argola ariranha armadura asa atriz azeitona bacia baguete baleia balsa banana bandana bandeira bandeja banheira banqueta
barata barba barca barraca barriga batata bateria bengala bermuda bexiga bica bigorna bike bilha bisnaga blusa blusinha bobina boca bochecha
boia boina bola bolacha bolha bolinha bolota bolsa bolsinha boneca borbulha borracha bota botina botinha brasa broa broca bruxa buzina
cabana cabine cabra cadeira caixa caixinha calda cama camisa camiseta camisola cana caneca canela caneta canoa cantora capa capela capivara
carne carpa carreta carta carteira cartola casa cascavel casinha castanha catraca cavala caverna cebola cegonha cenoura cerca cereja cesta cestinha
chaleira chama charrete chave choupana chupeta chuteira chuva cigarra cobra cobrinha cocada codorna coelha colcha coleira colher colina colmeia comida
corda corneta coroa correia corrente cortina coruja corvina costela couve coxa coxinha cozinha cratera cruz doca dourada ducha duna ema
empada empanada enguia enxada erva ervilha escada escola escova espada espinha espiral esponja esposa espuma estaca estante esteira estrada estrela
etiqueta fada faia faixa fantasia farda farinha farofa farpa fatia fazenda feira festa ficha figueira fila filha fita fivela flanela
flauta flecha flor floresta foca fogueira foice folha fonte formiga foto fralda franga freira fronha fruta fruteira gaiola gaita gaivota
galinha galocha gangorra garagem garganta garota garoupa garra garrafa gata gaveta gazela gelatina geleia gema gengiva gilete girafa goela goiaba
goiabada gola gota goteira gotinha grade gralha grama granola gravata graviola grelha groselha gruta guitarra harpa hiena horta idosa iguana
ilha ilhota isca jaca janela jangada jaqueta jararaca jarra jaula jiboia joaninha juba jujuba ladeira lagarta lagoa lagoinha lagosta lama
lancha lanterna laranja lareira lasanha lasca lata latinha lavadora lebre leiteira lenha lente lentilha leoa lesma lhama lichia lima limonada
linha livraria lixa lixeira loja lombada lombriga lona lontra lousa lua lula luneta lupa luva luz maca madeira madrinha maionese
mala maleta malinha mandioca manga manivela manta manteiga maraca mariposa marmita marreta medalha medusa meia melancia menina mesa mesinha mexerica
migalha minhoca mochila moeda moedinha moela moita moldura montanha moranga moringa morsa mosca mostarda moto motoca mula muleta mulher muralha
naja namorada nave neblina neta neve nogueira noiva noz nuvem oca ocarina oficina oliva oliveira omelete onda orca orelha ostra
ovelha paca padaria paleta palha palma palmeira pamonha panela panqueca pantera pantufa papinha papoula parede pasta pastilha pata pecinha pedra
pedrinha pele pelota peneira pera perdiz pereira perna persiana perua peruca pescada pestana peteca pia picape picareta pilha pimenta pinha
pintora pintura pipa pipoca piscina pitanga pizza pizzaria placa planta pluma pochete pocilga polenta poltrona pomba ponte porta porteira pousada
praia prancha prata presilha prima princesa pua pulga pulseira pupila quilha rabeca raia rainha raiz rampa rapadura raposa raquete rede
redinha regata rena represa revista ripa rocha roda rodinha roleta rolha rosa roupa rua sacola safira saia sala salada salsa
salsicha salsinha sanfona sardinha sauna secadora sela semente sereia seringa serpente serra seta sirene sogra soja solha sopa sopinha sucuri
sunga talha tamara tampa tampinha tapioca taquara tecla teia tela telha tenaz tenda terra tesoura testa tia tiara tigela tinta
titia toalha tocha tomada tora torneira torrada torre torta tortilha touca toupeira tromba trombeta trompa trufa truta tuba tulipa unha
uva vaca varanda vareta varinha vassoura veia vela venda ventosa verdura verruga vespa veste videira viga vila viola violeta viseira
vitrine vizinha voz webcam zebra
`,
  V: `
abaixa abana abre acaba acaricia acelera acerta aduba afaga afasta afia afunda agarra agita ajeita ajuda alfineta alimenta alinha alisa
alonga ama amarra amassa amola amolece amontoa anota apaga apalpa apanha apara aperta aponta aquece arranca arranha arrasta arruma aspira
assa assina assopra atinge atira atrai avisa baixa banha bate beija belisca bica bloqueia bochecha borda borra borrifa bota canta
capina captura carimba carrega cata cava cavalga celebra chama cheira chuta cisca clica colhe coloca colore comemora compra congela corta
cose cospe costura coze crava cutuca degusta derrama derrete derruba descasca descobre desdobra desenha desliga desmonta despeja desvia devora digita
dirige diverte dobra doma doura dribla embarca embrulha emenda empilha empina empurra encaixa enche encontra encosta enfeita enfia engole enrola
enrosca enruga ensaboa ensaia ensina entorna entorta entra entrega envolve enxuga ergue escava escolhe esconde escora escova escreve esculpe escuta
esfrega esfria esmaga espalha espelha espera espreme esquenta estende estica estoura estreia estuda esvazia explica explora fala fareja fatia faz
fecha festeja fixa flagra freia frita fura ganha gasta gela gira grampeia grelha grita gruda imita inclina infla joga lambe
lambuza lava levanta lima limpa lixa lustra mancha martela masca mastiga mexe mistura modela moe moi molda molha monta morde
move nivela olha ouve parte passa pede pega pendura peneira penteia perde perfura persegue pesa pesca petisca pilota pinta pisa
planta poda poli prega prende prepara procura produz protege prova provoca pune puxa quebra queima rabisca racha rasga raspa rebate
rebenta reboca recebe recorta reflete rega remenda remexe remove repara reparte repete responde retira risca roi saboreia saca sacode salga
salva seca segue segura sela semeia separa serra serve sinaliza soca solda solta sopra sorve sova suga suja tampa tapa
tateia tece tempera testa tira toca toma torce tosta trai tranca treina tricota trinca tritura troca vaporiza varre vende veste
vira visita volta vota
`,
  S: `
abaixa abana abre acaba acaricia acelera acena acerta acorda aduba afaga afasta afia afunda agacha agarra agita ajeita ajoelha ajuda
alfineta alimenta alinha alisa alonga ama amarra amassa amola amolece amontoa anda anota apaga apalpa apanha apara aparece aperta apita
aponta aquece arranca arranha arrasta arrota arruma aspira assa assina assobia assopra atinge atira atrai avisa baila baixa banha bate
beija belisca berra bica bloqueia boceja bochecha boia borbulha borda borra borrifa bota brilha brinca brinda bufa buzina cabeceia cai
caminha canta capina captura carimba carrega cata cava cavalga celebra chama chega cheira chia chora chuta cintila cisca clica colhe
coloca colore comemora compra congela corre corta cose cospe costura coze crava cutuca decola degusta deita derrama derrete derruba descansa
descasca desce descobre desdobra desenha desfila desliga desliza desmonta despeja desvia devora digita dirige diverte dobra doma dorme doura dribla
embarca embrulha emenda empilha empina empurra encaixa enche encolhe encontra encosta enfeita enfia engole enrola enrosca enruga ensaboa ensaia ensina
entorna entorta entra entrega envolve enxuga ergue escapa escava escolhe esconde escora escorre escova escreve esculpe escuta esfrega esfria esmaga
espalha espelha espera espirra espreme esquenta estala estende estica estoura estreia estuda esvazia explica explode explora fala fareja fatia faz
fecha ferve festeja finge fixa flagra flutua foge freia frita funga fura galopa gane ganha gargalha gasta gela ginga gira
goteja grampeia grelha grita gruda imita inclina infla janta joga jorra lambe lambuza late lava levanta lima limpa lixa lustra
mancha marcha martela masca mastiga mergulha mexe mia mistura modela moe moi molda molha monta morde move muge murmura nada
navega nivela olha ondula ouve parte passa passeia patina pedala pede pega pendura peneira penteia perde perfura persegue pesa pesca
petisca pia pilota pinta pisa pisca plana planta poda poli pousa prega prende prepara procura produz protege prova provoca pula
pulsa pune puxa quebra queima quica rabisca racha range rasga raspa rasteja rebate rebenta reboca rebola recebe reclama recorta reflete
rega relincha reluz rema remenda remexe remove repara reparte repete requebra resmunga respinga respira responde retira retorna risca roda rodopia
roi ronca ronrona rosna ruge saboreia saca sacode sai salga salta salva samba sapateia seca segue segura sela semeia senta
separa serra serve sibila sinaliza soa sobe soca solda solta sonha sopra sorri sorve sova sua submerge suga suja surfa
suspira sussurra tampa tapa tateia tece tempera testa tine tira toca toma torce tosse tosta trai tranca treina treme tricota
trinca tritura troca trota troveja uiva vaporiza varre vaza veleja vende venta veste viaja vibra vira visita voa volta vota
zune
`,
  A: `
abafado|abafada aberto|aberta aceso|acesa achatado|achatada acordado|acordada agitado|agitada agudo|aguda alegre alerta alto|alta amarelo|amarela amargo|amarga amassado|amassada amplo|ampla andando andante animado|animada ansioso|ansiosa antigo|antiga apertado|apertada
arenoso|arenosa arrumado|arrumada assado|assada atento|atenta ativo|ativa avoado|avoada azedo|azeda azul baixo|baixa barrento|barrenta batido|batida bege belo|bela bonito|bonita bordado|bordada branco|branca bravo|brava brega brilhoso|brilhosa bronze
brusco|brusca bruto|bruta cabeludo|cabeluda cacheado|cacheada calado|calada calmo|calma cansado|cansada caqui careca castanho|castanha celeste chatinho|chatinha cheio|cheia cheiroso|cheirosa chique chuvoso|chuvosa cinza ciumento|ciumenta claro|clara coberto|coberta
colorido|colorida colossal comprido|comprida confuso|confusa contente corado|corada corajoso|corajosa coral cortado|cortada cozido|cozida creme cremoso|cremosa crocante cru cruel curioso|curiosa curtinho|curtinha curto|curta curvo|curva danado|danada
decorado|decorada delgado|delgada desperto|desperta doce doido|doida dormido|dormida dourado|dourada duplo|dupla durinho duro|dura elegante enevoado|enevoada enorme enrolado|enrolada enrugado|enrugada escuro|escura esguio|esguia esperto|esperta espesso|espessa esticado|esticada
estranho|estranha estreito|estreita estufado|estufada falante falso|falsa faminto|faminta fechado|fechada fedido|fedida feliz felpudo|felpuda feroz fervente festeiro|festeira fibroso|fibrosa fininho|fininha fino|fina firme florido|florida fofinho|fofinha fofo|fofa
folgado|folgada forte fortinho|fortinha fosco|fosca fraco|fraca frio|fria frito|frita frouxo|frouxa fundo|funda gasto|gasta gelado|gelada gentil gigante girante gracioso|graciosa grande grosso|grossa grudado|grudada grudento|grudenta imenso|imensa
inchado|inchada inquieto|inquieta inteiro|inteira jeitoso|jeitosa jovem jubiloso|jubilosa laranja largo|larga lascado|lascada lento|lenta levado|levada leve ligado|ligada limpo|limpa lindo|linda lisinho|lisinha liso|lisa listado|listada listrado|listrada loiro|loira
longo|longa luminoso|luminosa lunar lustroso|lustrosa macia macio|macia maduro|madura malandro|malandra malva manchado|manchada manhoso|manhosa manso|mansa marrom mau medonho|medonha medroso|medrosa meigo|meiga mexido|mexida mimado|mimada mirim
moderno|moderna mole molenga molhado|molhada molinho|molinha montado|montada morno|morna mudo|muda murcho|murcha nadando nervoso|nervosa nevado|nevada novo|nova nublado|nublada oco|oca ocupado|ocupada ondulado|ondulada opaco|opaca oval parado|parada
pardo|parda pastoso|pastosa pedroso|pedrosa pegajoso|pegajosa peludo|peluda penteado|penteada pequeno|pequena perdido|perdida pesado|pesada picado|picada picante pintado|pintada plano|plana poderoso|poderosa podre polido|polida pontudo|pontuda poroso|porosa prateado|prateada profundo|profunda
quadrado|quadrada quebrado|quebrada queimado|queimada quente quieto|quieta rachado|rachada radiante radioso|radiosa raivoso|raivosa rajado|rajada ralado|ralada rasgado|rasgada raso|rasa recheado|recheada redondo|redonda retinho|retinha reto|reta rijo|rija riscado|riscada risonho|risonha
robusto|robusta rochoso|rochosa rombo|romba rosa rouco|rouca roxo|roxa rugoso|rugosa ruivo|ruiva salgado|salgada saltado|saltada santo|santa seco|seca sedento|sedenta sedoso|sedosa selvagem serelepe sereno|serena solto|solta sonoro|sonora suado|suada
suave sujo|suja surdo|surda surpreso|surpresa teimoso|teimosa tenro|tenra tenso|tensa torrado|torrada torto|torta tostado|tostada travesso|travessa tremido|tremida triplo|tripla unido|unida usado|usada vaidoso|vaidosa valente vasto|vasta vazio|vazia velhinho|velhinha
veloz ventoso|ventosa verde vermelho|vermelha vibrante vistoso|vistosa vivaz vivo|viva volumoso|volumosa xadrez zangado|zangada zonzo|zonza
`
};
