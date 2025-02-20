import { navigate, Link, routes } from '@redwoodjs/router'
import { MetaTags, useMutation } from '@redwoodjs/web'
import { useLazyQuery } from '@apollo/client'
import { toast, Toaster } from '@redwoodjs/web/toast'
import { useState } from 'react'
import { Form, Label, TextField, FormError, DateField, Submit } from '@redwoodjs/forms'
import { useStripe, useElements, IbanElement, CardElement } from '@stripe/react-stripe-js';
import { Tab } from '@headlessui/react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscriptionMutation($input: CreateSubscriptionInput!) {
    subscription: createSubscription(input: $input) {
      id
    }
  }
`

const EMAIL_SUBSCRIPTION = gql`
  mutation EmailSubscriptionMutation($id: Int!) {
    emailSubscription(id: $id)
  }
`

const SMS_SUBSCRIPTION = gql`
  mutation SMSSubscriptionMutation($input: sendSMSInput!) {
    sendSMS(input: $input) {
      id
    }
  }
`

const CREATE_CUSTOMER = gql`
  mutation CreateCustomerMutation($input: CreateCustomerInput!) {
    customer: createCustomer(input: $input) {
      id
    }
  }
`

const GET_CLIENT_SECRET = gql`
  query GetClientSecretQuery($query: String!) {
    customer: getClientSecret(query: $query) {
      secret
    }
  }
`

const CREATE_DEAL = gql`
  mutation CreateDealMutation($input: CreateDealInput!) {
    deal: createDeal(input: $input) {
      id
    }
  }
`

const CREATE_ORGANIZATION = gql`
  mutation CreateOrganizationMutation($input: CreateOrganizationInput!) {
    organization: createOrganization(input: $input) {
      id
    }
  }
`

const SubscribePage = ({f, n, c, e, p, l, m, s}) => {
  const [card, setCard] = useState(false)
  const [iban, setIban] = useState(false)

  const [createSubscription, {loading, error}] = useMutation(CREATE_SUBSCRIPTION, {
    onCompleted: (result) => {
      //console.log(JSON.stringify(result.subscription))
      toast.success('Abonnement ajouté.')
    },
  })

  const [emailSubscription] = useMutation(EMAIL_SUBSCRIPTION, {
    onCompleted: () => {
      toast.success('Mél de confirmation envoyé.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const [SMSSubscription] = useMutation(SMS_SUBSCRIPTION, {
    onCompleted: () => {
      toast.success('SMS de confirmation envoyé.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    onCompleted: (result) => {
      //console.log(JSON.stringify(result.customer))
      toast.success('Usager ajouté.')
    },
  })

  const [getClientSecret] = useLazyQuery(GET_CLIENT_SECRET, {
    onCompleted: (result) => {
      console.log(JSON.stringify(result))
    },
  })

  const [createDeal] = useMutation(CREATE_DEAL, {
    onCompleted: (result) => {
      toast.success('Affaire ajoutée.')
    },
  })

  const [createOrganization] = useMutation(CREATE_ORGANIZATION, {
    onCompleted: (result) => {
      //toast.success('Organisation ajoutée.')
    },
  })

  const stripe = useStripe();
  const elements = useElements();

  const IBAN_STYLE = {
    base: {
      color: '#32325d',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      },
      ':-webkit-autofill': {
        color: '#32325d',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
      ':-webkit-autofill': {
        color: '#fa755a',
      },
    }
  };

  const IBAN_ELEMENT_OPTIONS = {
    supportedCountries: ['SEPA'],
    placeholderCountry: 'FR',
    style: IBAN_STYLE
  };

  const [deliverDate, setDeliverDate] = useState(delayDate(Date(Date.now()), 6))

  const formatDate = (value) => {
    if (value) {
      return new Date(value).toISOString().substring(0,10)
    }
  }

  function delayDate(date, delay) {
    var nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + delay);
    // return next day if date on weekend
    if (nextDate.getDay() == 6 || nextDate.getDay() == 0) { return delayDate(nextDate, 1) }
    return nextDate;
  }

  const [subscription, setSubscription] = useState({
    firstname : f,
    lastname : n,
    company: c,
    email: e,
    phone : p,
    location : l,
    meals : parseInt(m),
    service : s,
    startedAt : '',
    card: '',
    iban: ''
  })

  const subscriptionSubmit = async (data) => {
    let sub = subscription
    sub.startedAt = data.startedAt
    
    /* Save customer */
    const customer = await createCustomer({ variables: {
      input: {
        description: subscription.firstname + ' ' + subscription.lastname.toUpperCase(),
        email: subscription.email
      }
    }})
    console.log(JSON.stringify(customer))
    sub.customer = customer.data.customer.id


    /* Add CARD payment */
    if (elements.getElement(CardElement)) {
      /* Get customer secret */
      var client_secret = await getClientSecret({ variables: {
        query: customer.data.customer.id
        }
      })
      console.log(JSON.stringify(client_secret.data.customer.secret))

      /* Add card to customer */
      const card = await stripe.confirmCardSetup(client_secret.data.customer.secret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: subscription.firstname + ' ' + subscription.lastname.toUpperCase(),
            email: subscription.email,
          },
        }
      });

      if (card.error) {
        // setError(`Payment failed ${payload.error.message}`);
        // setProcessing(false);
        // Show error to your customer.
        console.log("Error card:", card.error.message);
      } else {
        // setError(null);
        // setProcessing(false);
        // setSucceeded(true);
        console.log("Succeed card:", card.setupIntent.payment_method)
        toast.success('Carte bancaire ajoutée.')
        sub.card = card.setupIntent.payment_method
      }
    }


    /* Add IBAN payment */
    if (elements.getElement(IbanElement)) {
      /* Get customer secret */
      client_secret = await getClientSecret({ variables: {
        query: customer.data.customer.id
        }
      })
      console.log(JSON.stringify(client_secret.data.customer.secret))

      /* Add IBAN to customer */
      const sepa = await stripe.confirmSepaDebitSetup(client_secret.data.customer.secret, {
        payment_method: {
          sepa_debit: elements.getElement(IbanElement),
          billing_details: {
            name: subscription.firstname + ' ' + subscription.lastname.toUpperCase(),
            email: subscription.email,
          },
        }
      });
      if (sepa.error) {
        // Show error to your customer.
        console.log("Error SEPA:", sepa.error.message);
      } else {
        console.log("Succeed SEPA:", sepa.setupIntent.payment_method)
        sub.iban = sepa.setupIntent.payment_method
        toast.success('Compte bancaire ajouté.')
        // Show a confirmation message to your customer.
        // The SetupIntent is in the 'succeeded' state.
      }
    }

    /* Save subscription */
    setSubscription(sub)
    sub = await createSubscription({ variables: { input: subscription } })
    console.log(JSON.stringify(sub))

    /* Send email subscription */
    emailSubscription({ variables: { id: sub.data.subscription.id } })

    /* Send SMS subscription */
    // console.log(JSON.stringify(subscription))
    //SMSSubscription({ variables: { input: {text: "Abonnement prêt", from:'+1 207 705 5921', 'to': subscription.phone }} })

    /* Add new deal to pipedrive (CRM) */
    // Create organization
    const organization = {
      name: subscription.company
    }
    const org = await createOrganization({ variables: { input: organization }})

    // Create deal
    const deal = {
      title: '#' + sub.data.subscription.id + ' - ' + subscription.company,
      value: (subscription.meals*0.1).toString(),
      orgId: org.data.organization.id,
      pipelineId: '8',
      stageId: '55',
      status: 'won'
    }
    createDeal({ variables: { input: deal }})  

    navigate(routes.confirm())
  }

  return (
    <>
      <MetaTags title="Subscribe" description="Subscribe page" />
      { subscription &&
      <div>
        <div>
          <Link className="text-white" to={routes.offer({l:l, m:m, f:f, n:n, c:c, e:e, p:p, s:s})}>&lt; Changer d'Offre</Link>
        </div>
        <div className="font-bold text-center text-3xl md:text-5xl mt-16 text-black w-min mx-auto -rotate-2">
          <span className="bg-yellow-400 p-1 block w-min">Commencez&nbsp;aujourd'hui,</span>
          <span className="bg-yellow-400 p-1 block w-min mt-1">Payez&nbsp;plus&nbsp;tard&nbsp;!</span>
        </div>
        <div className="container mx-auto max-w-6xl font-sans">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <div className="bg-white rounded-md shadow-lg p-8 mt-8">
                <h1 className="uppercase font-bold text-lg text-center mb-6">Contrat de tri des biodéchets</h1>
                <ul>
                  <li><span className="font-bold">Société : </span><span className="uppercase">{subscription.company}</span></li>
                  <li><span className="font-bold">Contact : </span><span className="capitalize">{subscription.firstname}</span> <span className="uppercase">{subscription.lastname}</span></li>
                  <li><span className="font-bold">Tél : </span><span className="">{subscription.phone}</span></li>
                  <li><span className="font-bold">Mél : </span><span className="">{subscription.email}</span></li>
                  <li><span className="font-bold">Adresse de collecte : </span><span className="">{subscription.location}</span></li>
                  <li><span className="font-bold">Prestation : </span><span className="">Collecte et compostage des biodéchets alimentaires</span></li>
                  <li><span className="font-bold">Offre : </span><span className="">{subscription.service}</span></li>
                </ul>
                {/* Display mandate acceptance text. */}
                <hr className="mt-2"/>
              <div className="text-xs block mt-2 text-justify">
                En fournissant vos informations de paiement et en confirmant ce paiement, vous autorisez (A) LES DETRITIVORES et Stripe, notre prestataire de services de paiement et/ou PPRO, son prestataire de services local, à envoyer des instructions à votre banque pour débiter votre compte et (B) votre banque à débiter votre compte conformément à ces instructions. Vous avez, entre autres, le droit de vous faire rembourser par votre banque selon les modalités et conditions du contrat conclu avec votre banque. La demande de remboursement doit être soumise dans un délai de 8 semaines à compter de la date à laquelle votre compte a été débité. Vos droits sont expliqués dans une déclaration disponible auprès de votre banque. Vous acceptez de recevoir des notifications des débits à venir dans les 2 jours précédant leur réalisation.
              </div>
              </div>
            </div>
            <div>
              <Toaster />
              <Form onSubmit={subscriptionSubmit} config={{ mode: 'onBlur' }} error={error} className="container mx-auto font-sans">
                <FormError error={error} wrapperClassName="form-error" />
                <div className="bg-white rounded-t-lg shadow-lg p-8 mt-8">
                  <Label className="font-medium block">
                    Date de démarrage
                  </Label>
                  <DateField name="startedAt" onChange={(date) => setDeliverDate(delayDate(new Date(date.target.value),0))} min={formatDate(delayDate(new Date(Date.now()),6))} value={formatDate(deliverDate)} className="capitalize block w-full bg-gray-200 rounded-md p-2 text-sm outline-orange-300"/>

                  <Label className="font-medium block mt-6">
                    Mode de réglement
                  </Label>

                  <Tab.Group defaultIndex={0}>
                    <Tab.List className="flex space-x-3">
                      <Tab
                        className={({ selected }) =>
                          classNames(
                            'p-3 w-1/2 border-2 border-gray-500 text-gray-500 rounded-md hover:border-yellow-500 outline-none',
                            selected
                              ? 'bg-yellow-400 text-black font-bold border-none'
                              : 'bg-none'
                          )}>Carte bancaire</Tab>
                      <div className="p-1 my-auto">ou</div>
                      <Tab
                        className={({ selected }) =>
                          classNames(
                            'p-3 w-1/2 border-2 border-gray-500 text-gray-500 rounded-md hover:border-yellow-500 outline-none',
                            selected
                              ? 'bg-yellow-400 text-black font-bold border-none'
                              : 'bg-none'
                          )}>IBAN</Tab>
                    </Tab.List>
                    <Tab.Panels className="mt-3">
                      <Tab.Panel>
                        <CardElement onChange={(e) => {setCard(e.complete)}} options={{hidePostalCode:true}} placeholder="4242424242424242" className="capitalize block w-full bg-gray-200 rounded-md p-2 text-sm outline-orange-300"/>
                      </Tab.Panel>
                      <Tab.Panel>
                        <IbanElement onChange={(e) => {setIban(e.complete)}} options={IBAN_ELEMENT_OPTIONS} placeholder="FR1420041010050500013M02606" className="capitalize block w-full bg-gray-200 rounded-md p-2 text-sm outline-orange-300"/>  
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
                <div>
                  <Submit
                    disabled={loading || !(card || iban)}
                    className={`sm:text-sm md:text-lg uppercase font-bold ${(card || iban) ? 'bg-yellow-400 text-black' : 'bg-gray-600 text-white'} rounded-b-md p-4 w-full shadow-lg`}>S'abonner</Submit>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    }
    </>
  )
}

export default SubscribePage
