import { db } from 'src/lib/db'
import { sendEmail } from 'src/lib/email'

export const subscriptions = () => {
  return db.subscription.findMany()
}

export const subscription = ({ id }) => {
  return db.subscription.findUnique({
    where: { id },
  })
}

export const createSubscription = ({ input }) => {
  return db.subscription.create({
    data: input,
  })
}

export const updateSubscription = ({ id, input }) => {
  return db.subscription.update({
    data: input,
    where: { id },
  })
}

export const deleteSubscription = ({ id }) => {
  return db.subscription.delete({
    where: { id },
  })
}

export const emailSubscription = async ({ id }) => {
  const subscription = await db.subscription.findUnique({
    where: { id },
  })
  let paymentMethod = subscription.card ? 'Carte bancaire' : 'Prélèvement SEPA'
  let startedAt = new Date(subscription.startedAt).toLocaleDateString("fr")
  const subject = 'CLIC & COMPOST #' + subscription.id + ' - Vous êtes prêts à trier vos biodéchets !'
  const text =
    'Bienvenu ' + subscription.firstname + ' !\n\n' +
    'La coopérative inclusive LES DETRITIVORES est heureuse de vous compter parmi les pionniers du tri des biodéchets :)\n\n' +
    'Voici un récapitulatif de votre inscription :\n' +
    '------------------------------------------------------\n' +
    'Numéro d\'adhésion : ' + subscription.id + '\n' +
    'Société : ' + subscription.company + '\n' +
    'Contact : ' + subscription.firstname + ' ' + subscription.lastname + '\n' +
    'Tél : ' + subscription.phone + '\n' +
    'Mél : ' + subscription.email + '\n' +
    'Adresse de collecte : ' + subscription.location + '\n' +
    'Offre : ' + subscription.service + '\n' +
    'Mode de réglement : ' + paymentMethod + '\n' +
    'Date de démarrage : ' + startedAt + '\n' +
    '-------------------------------------------------------\n\n' +
    'N\'hésitez pas à nous contacter pour toutes questions :\n' +
    'LES DETRITIVORES\n' +
    '65 quai de Brazza 33100 Bordeaux\n' +
    'bonjour@les-detritivores.co | 05 56 67 14 47' 

  const html =
    'Bienvenu ' + subscription.firstname + ' !<br/><br/>' +
    'La coopérative inclusive LES DETRITIVORES est heureuse de vous compter parmi les pionniers du tri des biodéchets :)<br/><br/>' +
    'Voici un récapitulatif de votre inscription :<br/>' +
    '<hr/>' +
    'Numéro d\'adhésion : ' + subscription.id + '<br/>' +
    'Société : ' + subscription.company + '<br/>' +
    'Contact : ' + subscription.firstname + ' ' + subscription.lastname + '<br/>' +
    'Tél : ' + subscription.phone + '<br/>' +
    'Mél : ' + subscription.email + '<br/>' +
    'Adresse de collecte : ' + subscription.location + '<br/>' +
    'Offre : ' + subscription.service + '<br/>' +
    'Mode de réglement : ' + paymentMethod + '<br/>' +
    'Date de démarrage : ' + startedAt + '<br/>' +
    '<hr/><br/>' +
    'N\'hésitez pas à nous contacter pour toutes questions :<br/>' +
    'LES DETRITIVORES<br/>' +
    '65 quai de Brazza 33100 Bordeaux<br/>' +
    'bonjour@les-detritivores.co | 05 56 67 14 47' 

  console.log(text, html)
  const email = await sendEmail({ to: subscription.email, bcc: ['bonjour@les-detritivores.co' /*, 'Développement commercial <ec52413f.les-detritivores.co@fr.teams.ms>'*/], subject, text, html })
  return email.messageId
}
