if (Meteor.isClient) {
	Meteor.startup(function() {
		$('html').attr('lang', 'pt-BR');
	});

	Session.setDefault('card_hash', 0);
	Session.setDefault('flash_message', {});
	Session.setDefault('page_name', 'vazia');
	Session.setDefault('plano_ativo', 0);
	Session.setDefault('form_details_validate', false);

	Template.doacao.helpers({
		plano_ativo: function () {
			return Session.get('plano_ativo');
		},
		is_outro_plano_visible: function () {
			return Session.get('is_outro_plano_visible');
		},
		is_form_details_validate: function () {
			return Session.get('form_details_validate');
		},

		// integracao pagar.me
		card_hash: function () {
			return Session.get('card_hash');
		},
		planos: function () {
			return [
				{name: 'Ideal 2',  id: 21693, valor: 40.00, color: 'rgb(38, 53,  96)'},
				{name: 'Ideal',    id: 21692, valor: 30.00, color: 'rgb(53, 68,  142)'},
				{name: 'Mínimo 2', id: 21691, valor: 20.00, color: 'rgb(32, 63,  44)'},
				{name: 'Mínimo',   id: 21690, valor: 10.00, color: 'rgb(27, 102, 64)'}
			]
		},
		flash_message: function () {
			return Session.get('flash_message');
		}
	});

	var trocar_plano = function (plano_id) {
			if (plano_id === 'outro-valor') { // ativa plano para planos maiores
				Session.set('is_outro_plano_visible', true);
				Session.set('plano_ativo', 0);
			} else if (plano_id === 0) { // desativa área de planos
				Session.set('is_outro_plano_visible', false);
				Session.set('plano_ativo', 0);
			} else if (_.isNumber(parseInt(plano_id))) { // ativa plano no array de planos
				Session.set('is_outro_plano_visible', false);
				Session.set('plano_ativo', plano_id);
			}
	};

	Template.doacao.events({
		'click #cancelar': function(evt) {
			trocar_plano(0);
			return false;
		},
		'click .plano': function(evt) {
			var plano_id = evt.target.id;
			trocar_plano(plano_id);
			return false;
		},
		'submit #pagamento': function (evt) {
			evt.preventDefault();
			PagarMe.encryption_key = Meteor.settings.public.PagarMe.ENCRYPTION_KEY;
			var creditCard = new PagarMe.creditCard();
			creditCard.cardHolderName	   = evt.target.card_holder_name.value;
			creditCard.cardExpirationMonth = evt.target.card_expiration_month.value;
			creditCard.cardExpirationYear  = evt.target.card_expiration_year.value;
			creditCard.cardNumber		   = evt.target.card_number.value;
			creditCard.cardCVV			   = evt.target.card_cvv.value;

			// pega os erros de validação nos campos do form
			var fieldErrors = creditCard.fieldErrors();

			//Verifica se há erros
			var hasErrors = false;
			for(var field in fieldErrors) { hasErrors = true; break; }

			if(hasErrors) {
				// realiza o tratamento de errors
				//var list_errors = _.each(fieldErrors, function(v, k, list) { console.log(k,v); return k + ':' + v; })
				var stringErrors = [];
				for (var field in fieldErrors) {
					stringErrors.push(fieldErrors[field]);
				}

				Session.set('flash_message', {
					className: 'alert-error alert',
					text: 'Falta preencher informações. Operação não pode ser realizada. ' + stringErrors.join(" - ")
				});
			} else {
				// se não há erros, gera o card_hash...
				creditCard.generateHash(function(cardHash) {
					Session.set('card_hash', cardHash);

					var customer = {
						name            : evt.target.customer_name.value,
						document_number : evt.target.customer_document_number.value,
						born_at         : evt.target.customer_born_at.value,
						gender          : evt.target.customer_gender.value,
						email           : evt.target.customer_email.value
					};
					var address = {
						street        : evt.target.customer_address_street.value,
						neighborhood  : evt.target.customer_address_neighborhood.value,
						zipcode       : evt.target.customer_address_zipcode.value,
						street_number : evt.target.customer_address_street_number.value,
						complementary : evt.target.customer_address_complementary.value
					};
					var phone = {
						ddd    : evt.target.customer_phone_ddd.value,
						number : evt.target.customer_phone_number.value
					};
					var plan_id = evt.target.plan_id.value;

					Meteor.call('assinar_plano', plan_id, cardHash, customer, address, phone, function(err, results) {
						if ( (typeof err === undefined) && (results.statusCode === 200) ) {
							Session.set('flash_message', {
								className: 'alert-success alert',
								text:'Assinatura realizada com sucesso.'
							});
						} else {
							var stringErrors = [];
							// console.log(results, err);
							// for (var field in results.errors) {
							// 	stringErrors.push(results.errors[field].message);
							// }
							Session.set('flash_message', {
								className: 'alert-success alert',
								text:'Falha ao tentar realizar a assinatura.' + stringErrors.join(" - ")
							});
						}
					});
				});
			}
		}
	});
}

if (Meteor.isServer) {

Meteor.methods({
	'assinar_plano': function (plan_id, card_hash, customer, address, phone) {
		return HTTP.call("POST", "https://api.pagar.me/1/subscriptions", {
				data: {
					api_key: Meteor.settings.PagarMe.API_KEY,
					plan_id: plan_id,
					card_hash: card_hash,
					customer: _.extend(customer, {
						address: address,
						phone: phone
					})
				}
			});
	}
});

  Meteor.startup(function () {
	// code to run on server at startup
  });
}
