import axios from 'axios';

import Order from '../../app/models/Order';
import Validated from '../../app/models/Validated';
import Card from '../../app/models/Card';
import Event from '../../app/models/Event';

class SyncingDatabase {
  constructor() {
    this.init();
  }

  init() {
    setInterval(async function () {
      const chave_aplicacao = 'bac71631-6746-4fec-a391-79426b0568d5';
      const chave_api = 'fdef8cea32652c3484c7';

      const { count } = await Order.findAndCountAll();

      if (count === 0) {

        const { data } = await axios.get(`https://api.awsli.com.br/v1/pedido/100?chave_aplicacao=${chave_aplicacao}&chave_api=${chave_api}`);

        const firs_order = {
          numero_pedido: data.numero,
          id_produto: data.itens[0].id,
          quantidade: data.itens[0].quantidade,
          preco_venda: data.itens[0].preco_venda,
          sku: data.itens[0].sku,
          data_criacao: data.data_criacao,
          data_expiracao: data.data_expiracao,
          data_modificacao: data.data_modificacao,
          situacao: data.situacao.nome,
          id_situacao: data.situacao.id,
          valor_total: data.valor_total,
          email: data.cliente.email,
          nome: data.cliente.nome === '' ? null : data.cliente.nome,
          razao_social: data.cliente.razao_social === '' ? null : data.cliente.razao_social,
          telefone_celular: data.cliente.telefone_celular === '' ? null : data.cliente.telefone_celular,
          telefone_principal: data.cliente.telefone_principal === '' ? null : data.telefone_principal,
        };

        await Order.create(firs_order);
      }

      //Recuperar último pedido no banco
      const { numero_pedido: last_order } = await Order.findOne({
        order: [['createdAt', 'DESC']],
      });

      for (let next_order = last_order + 1; next_order <= last_order + 50; next_order++) {
        try {
          console.log(`Pedido ${next_order}`);
          const { data } = await axios.get(`https://api.awsli.com.br/v1/pedido/${next_order}?chave_aplicacao=${chave_aplicacao}&chave_api=${chave_api}`);


          for (const [, item] of data.itens.entries()) {
            const new_row = {
              numero_pedido: data.numero,
              id_produto: item.id,
              quantidade: item.quantidade,
              preco_venda: item.preco_venda,
              sku: item.sku,
              data_criacao: data.data_criacao,
              data_expiracao: data.data_expiracao,
              data_modificacao: data.data_modificacao,
              situacao: data.situacao.nome,
              id_situacao: data.situacao.id,
              valor_total: data.valor_total,
              email: data.cliente.email,
              nome: data.cliente.nome === '' ? null : data.cliente.nome,
              razao_social: data.cliente.razao_social === '' ? null : data.cliente.razao_social,
              telefone_celular: data.cliente.telefone_celular === '' ? null : data.cliente.telefone_celular,
              telefone_principal: data.cliente.telefone_principal === '' ? null : data.telefone_principal,
            };

            await Order.create(new_row);

            const isApproved = 4;
            if (new_row.id_situacao === isApproved) {

              // Verifica se já foram vendidas cartelas para este evento
              const validated_count = await Validated.count({
                where: {
                  edition: new_row.sku,
                }
              });

              // Recupera a cartela inicial de lançamento
              const { initial_card, initial_lot } = await Event.findOne({
                where: {
                  edition: new_row.sku,
                },
              });

              const current_card = initial_card + validated_count;

              for (let i = 0; i < new_row.quantidade; i++) {
                const card = await Card.findOne({
                  where: {
                    numero: current_card + i,
                  },
                  attributes: ['numero', 'digito', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10', 'n11', 'n12', 'n13', 'n14', 'n15', 'codigo'],
                });

                const updated_count = validated_count + i;

                const current_lot = Math.floor(updated_count / 100) + initial_lot;
                const current_lan = updated_count >= 100
                  ? (validated_count - Math.floor(updated_count / 100) * 100) + 1
                  : validated_count + 1;

                await Validated.create({
                  lote: current_lot,
                  lancamento: current_lan + i,
                  edition: new_row.sku,
                  ...card.dataValues,
                  pedido: new_row.numero_pedido,
                  comprador: new_row.nome !== null ? new_row.nome : new_row.razao_social,
                  telefone: new_row.telefone_celular !== null ? new_row.telefone_celular : new_row.telefone_principal,
                  vendedor: 'Lojinha Paroquial',
                });
              }
            }
          };
        } catch (error) {
          break;
        }
      }

      console.log('Finalizado');
    }, 180000);
  }
}

export default new SyncingDatabase();