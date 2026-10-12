# Demandou: estado em 12/10/2026 (madrugada e manhã)

Continuação de docs/editor-do-curso-1110.md. Tudo abaixo está PUBLICADO (app na Vercel, worker no Railway) salvo onde diz o contrário.

## Regras novas do Bruno (12/10)

- **Portão antes de todo deploy:** teste de ponta a ponta curto no que já funcionava; reprovou, não publica. Cada conserto leva teste automático que trava o defeito.
- **Quem confere vídeo e arte é o Bruno:** Claude não olha quadros por conta própria; sobe vídeo e imagens no artefato "Provas do editor novo" (https://claude.ai/artifact/1cAUVnyD1Pt8aEgh8S5iiZ) e manda o link. Exceção: quando o Bruno autoriza examinar para corrigir.
- **Arte livre (a regra de 11/10 caiu):** a IA de imagem recebe a foto da pessoa e o texto do post e cria a cena inteira, como no Gemini. "A Demandou traz o contexto, o cliente traz o desejo, o Nano Banana Pro entrega."
- **O pedido de ajuste não mostra a regra:** os motivos vêm juntos (sem "gosto cobra / erro grátis"); o preço aparece depois do motivo; erro pede declaração; a falha apontada sai sem cobrança na hora e vai à auditoria.
- **Corte de custo das imagens:** uma geração por arte e no máximo 2 tentativas.

## O que mudou (por área)

### Artes
- `lib/media/editor-do-curso/arte-livre.ts`: com foto da pessoa nos materiais, a imagem do post vai ao Nano Banana Pro com a foto e o texto (ARTE_LIVRE=0 desliga). **Só a imagem única do post**; carrossel e infográfico ainda pelo caminho do estilo.
- `lib/media/arte-por-rede.ts`: uma geração no 4:5; LinkedIn e Facebook saem da mesma arte encaixada sem cortar (ARTE_UMA_GERACAO=0 volta); 2 tentativas (ARTE_TENTATIVAS); uma volta no mesmo estilo (ARTE_VOLTAS_NO_ESTILO); volta extra do ajuste só com AJUSTE_VOLTA_EXTRA=1. Uma arte caía de até 9 imagens (US$ 1,10) para 1 a 2 (US$ 0,13 a 0,27).
- Escolha da arte antes de gerar (ESCOLHA_DA_ARTE=1 na Vercel): `lib/media/escolha-da-arte.ts`, popup `components/escolha-da-arte/escolha-da-arte.tsx` (por portal), rota `/api/posts/[id]/escolha-da-arte`; arte do pacote do vídeo não cobra de novo.
- Ajuste da arte pelo chat no estilo gravado: `refazerNoEstiloComPedido` (arte-pelo-modelo-servidor.ts) + `pedido-da-arte.ts` (Claude reescreve o pedido como direção de arte; Haiku descreve; JEV confere item a item).
- Biblioteca no popup: grade pela largura, sem número sobre a prévia, sem cartão sem prévia, selos de curadoria só para admin.
- Arte do post no card inteira e ampliável (visor por portal); quadro relê durante ajuste ou arte em geração.

### Pedido de ajuste e reprovação
- `components/posts/motivo-do-ajuste.tsx` e `janela-de-reprovacao.tsx`: motivos juntos com rótulos novos; gosto mostra preço e confirma; erro pede declaração.
- `lib/credits/ajuste-servidor.ts`: falha apontada não confirmada sai sem cobrança (`ajuste.pendente`) dentro do teto do dia e se a conta não tiver 3 não confirmadas em 30 dias; `decidirReprovacaoPeloAdmin` com "manter" cobra o pendente uma vez.

### Chat do card e quadro
- Ação "story" no chat (`levarParaOStory`, `lib/publish/lugar-novo.ts`); Blotato manda a arte do story em 9:16.
- Cancelar a peça arquiva a prévia e a publicação do dia que ficou sem post.
- Barras do microfone (`components/ui/nivel-do-audio.tsx`).

### Vídeo (Recorte com letreiro, cortes e completo em pé)
- ENQUADRAMENTO_ADAPTATIVO=1 no Railway (todos, desde 12/10 09h34): escala pelo corpo da gravação, cabeça por fora alta (29%) e corpo grande, janela baixa 560+ x 800+, borda do recorte encolhida 1,5 px, `PalavraAtrasDaCabeca` no kit (base das letras 60 px abaixo do topo da cabeça). Revisão reprova "espaco-vazio" e "texto-escondido".
- Conserto que fez funcionar: o projeto vai a cada bloco do completo (`completo-avancado.mjs`).
- Conserto do completo nos modelos do curso: o `/editar-no-modelo` pede o plano no `planoUrl` (teste trava o erro de d368b43).
- Capa: gravação comprimida usa o melhor quadro dela (piso de nitidez 25), não a foto da Biblioteca.

## Custos (análise de 12/10)
- Google em 30 h: US$ 42,40; 81% do projeto de teste (os testes de 11/10). Crédito vale R$ 0,15 (Starter R$ 2.997 / 20.000). Refazer arte = 84 créditos = R$ 12,60.
- O Google ficou sem saldo (HTTP 402) na madrugada; o Bruno recarregou.

## Aberto (próxima conversa)
1. Palavra grande do vídeo DEITADO cortada em cima (print do Bruno no completo 16:9 da tenda): conferir que a `PalavraAtrasDaCabeca` resolve no deitado (o vídeo do print é de antes dela) e, se não, ajustar o 16:9.
2. Carrossel e infográfico pela arte livre do Nano Banana Pro (hoje só a imagem única do post vai livre).
3. Imagem de referência anexada no chat do card e na escolha da arte (o caso Volkswagen): a Demandou junta referência, texto, marca e foto e manda ao Nano Banana Pro.
4. Recorte de foto pelo BiRefNet (fal.ai) em vez do MediaPipe, para os estilos que ainda colam a pessoa.
5. Teto diário de gasto interno (o Bruno escolhe o valor) e alerta de orçamento no Google Cloud.
6. Devolver os 84 créditos da arte de quinta (resposta do Bruno pendente).
7. As 27 versões 16:9 dos modelos fora do git: decidir e provar uma por vez.
8. A falha antiga "nenhum trecho aproveitável" não fecha o quadro (rara).
