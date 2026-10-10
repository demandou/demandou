# Exemplo do modelo dicionario: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.33 s
Fala: “Três palavras em espanhol que enganam todo brasileiro”

```json
{"texto": "palavras / em espanhol", "destaque": "enganam", "rotulo": "Falsos amigos · ES → PT", "numero": {"em": 0.1, "texto": "3"}, "subtitulo": "que enganam todo brasileiro"}
```

## 2. `verbete` (assinatura): 3.33–7.10 s
Fala: “Esquisito não é esquisito, quer dizer delicioso.”

```json
{"palavra": {"em": 3.41, "texto": "exquisito", "silabas": "ex·qui·si·to"}, "classe": "adj.", "pronuncia": "eks-ki-SÍ-to", "parece": {"em": 4.6, "texto": "esquisito", "glosa": "estranho", "riscaEm": 5.25, "idioma": "PT"}, "significa": {"em": 6.38, "texto": "delicioso", "extra": "requintado", "viraEm": 5.85}, "carimbo": {"em": 6.62, "texto": "Falso amigo"}, "vizinhos": {"antes": [{"palavra": "experto", "classe": "adj.", "def": "especialista"}, {"palavra": "expirar", "classe": "v.", "def": "expirar"}, {"palavra": "explanada", "classe": "s.f.", "def": "esplanada"}, {"palavra": "explicación", "classe": "s.f.", "def": "explicação"}, {"palavra": "explicar", "classe": "v.", "def": "explicar"}, {"palavra": "explorar", "classe": "v.", "def": "explorar"}, {"palavra": "explosión", "classe": "s.f.", "def": "explosão"}, {"palavra": "exponer", "classe": "v.", "def": "expor"}, {"palavra": "exportar", "c …
```

## 3. `verbete` (assinatura): 7.10–10.46 s
Fala: “Embaraçada não é embaraçada. é grávida.”

```json
{"palavra": {"em": 7.2, "texto": "embarazada", "silabas": "em·ba·ra·za·da"}, "classe": "adj.", "pronuncia": "em-ba-ra-SSA-da", "parece": {"em": 8.53, "texto": "embaraçada", "glosa": "envergonhada", "riscaEm": 9.12, "idioma": "PT"}, "significa": {"em": 9.66, "texto": "grávida", "viraEm": 9.3}, "carimbo": {"em": 9.98, "texto": "Falso amigo"}, "vizinhos": {"antes": [{"palavra": "embadurnar", "classe": "v.", "def": "besuntar"}, {"palavra": "embajada", "classe": "s.f.", "def": "embaixada"}, {"palavra": "embajador", "classe": "s.m.", "def": "embaixador"}, {"palavra": "embalaje", "classe": "s.m.", "def": "embalagem"}, {"palavra": "embalar", "classe": "v.", "def": "embalar"}, {"palavra": "embaldosar", "classe": "v.", "def": "ladrilhar"}, {"palavra": "embalsamar", "classe": "v.", "def": "embalsamar"}, {"palavra": "embalse", "classe": "s.m.", "def": "represa"}], "depois": [{"palavra": "embarazo",  …
```

## 4. `verbete` (assinatura): 10.46–13.53 s
Fala: “E polvo não é o animal. É poeira.”

```json
{"palavra": {"em": 10.55, "texto": "polvo", "silabas": "pol·vo"}, "classe": "s.m.", "pronuncia": "PÔL-bo", "parece": {"em": 11.07, "texto": "polvo", "glosa": "o animal", "figura": "polvo", "riscaEm": 12.1, "idioma": "PT"}, "significa": {"em": 12.92, "texto": "poeira", "extra": "pó", "figura": "poeira", "viraEm": 12.45}, "carimbo": {"em": 13.05, "texto": "Falso amigo"}, "vizinhos": {"antes": [{"palavra": "polaco", "classe": "adj.", "def": "polonês"}, {"palavra": "polar", "classe": "adj.", "def": "polar"}, {"palavra": "polea", "classe": "s.f.", "def": "polia"}, {"palavra": "polémica", "classe": "s.f.", "def": "polêmica"}, {"palavra": "polen", "classe": "s.m.", "def": "pólen"}, {"palavra": "policía", "classe": "s.f.", "def": "polícia"}, {"palavra": "polilla", "classe": "s.f.", "def": "traça"}, {"palavra": "política", "classe": "s.f.", "def": "política"}, {"palavra": "póliza", "classe": "s.f …
```

## 5. `remissao` (assinatura): 13.53–16.10 s
Fala: “O polvo, em espanhol, é pulpo.”

```json
{"rotulo": {"em": 13.6, "texto": "O polvo, em espanhol"}, "figura": {"nome": "polvo", "em": 13.75}, "palavra": {"em": 15.28, "texto": "pulpo", "silabas": "pul·po"}, "classe": "s.m.", "pronuncia": "PUL-po", "definicao": {"em": 15.55, "texto": "polvo (o animal)"}, "vizinhos": {"antes": [{"palavra": "pulga", "classe": "s.f.", "def": "pulga"}, {"palavra": "pulgar", "classe": "s.m.", "def": "polegar"}, {"palavra": "pulir", "classe": "v.", "def": "polir"}, {"palavra": "pulmón", "classe": "s.m.", "def": "pulmão"}, {"palavra": "pulpa", "classe": "s.f.", "def": "polpa"}, {"palavra": "púlpito", "classe": "s.m.", "def": "púlpito"}], "depois": [{"palavra": "pulsar", "classe": "v.", "def": "pulsar, apertar"}, {"palavra": "pulsera", "classe": "s.f.", "def": "pulseira"}, {"palavra": "pulso", "classe": "s.m.", "def": "pulso"}, {"palavra": "puma", "classe": "s.m.", "def": "puma"}]}}
```

## 6. `cta` (bloco universal): 16.10–19.28 s
Fala: “Salva para não passar vergonha na próxima viagem.”

```json
{"chamada": "Salva", "texto": "pra não passar vergonha / na próxima viagem.", "icone": "salvar", "destaque": "vergonha"}
```
