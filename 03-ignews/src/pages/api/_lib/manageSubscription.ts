import { query as q } from 'faunadb'
import { fauna } from '../../../services/fauna';
import { stripe } from '../../../services/stripe';

export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false,
) {
  // -> Buscar o usuario no banco do fauna com o Id { customerId }
    const userRef = await fauna.query(
      q.Select(
        'ref',
        q.Get(
          q.Match(
            q.Index('user_by_stripe_customer_id'),
            customerId
          )
        )
      )
    )

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const subscriptionData = {
      id: subscription.id,
      user_id: userRef,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
    }

  // -> Salvar os dados da subscription no FaunaDB

    // --> se tiver action true, cria subscription
    if (createAction) {
      await fauna.query(
        q.Create(
          q.Collection('subscriptions'),
          { data: subscriptionData }
        )
      )
    // ---> se NÃO tiver action true, substitui subscription pela atual
    } else {
      await fauna.query(
        q.Replace(
          q.Select(
            'ref',
            q.Get(
              q.Match(
                q.Index('subscription_by_id'),
                subscriptionId,
              )
            )
          ),
          { data: subscriptionData }
        )
      )
    }
}