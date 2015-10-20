var timer = 0;
var INITIAL_INTERVAL = 60;
var META_TOTAL = 1000.00;
SimpleSchema.messages({
	required: "[label] é obrigatório",
	minString: "[label] must be at least [min] characters",
	maxString: "[label] cannot exceed [max] characters",
	minNumber: "[label] must be at least [min]",
	maxNumber: "[label] cannot exceed [max]",
	minDate: "[label] must be on or after [min]",
	maxDate: "[label] cannot be after [max]",
	badDate: "[label] is not a valid date",
	minCount: "You must specify at least [minCount] values",
	maxCount: "You cannot specify more than [maxCount] values",
	noDecimal: "[label] must be an integer",
	notAllowed: "[value] is not an allowed value",
	expectedString: "[label] must be a string",
	expectedNumber: "[label] must be a number",
	expectedBoolean: "[label] must be a boolean",
	expectedArray: "[label] must be an array",
	expectedObject: "[label] must be an object",
	expectedConstructor: "[label] must be a [type]",
	regEx: [
		{msg: "[label] failed regular expression validation"},
		{exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},
		{exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},
		{exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
		{exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
		{exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
		{exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
		{exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
		{exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
		{exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"}
	],
	keyNotInSchema: "[key] is not allowed by the schema"
});
if (Meteor.isClient) {
	Session.setDefault('card_hash', 0);
	Session.setDefault('flash_message', {});
	Session.setDefault('page_name', 'vazia');
	Session.setDefault('plano_ativo', 0);
	Session.setDefault('timer_atualizar_meta', INITIAL_INTERVAL);
	Session.setDefault('progresso_meta', { 'alcancado': 10.00, 'total': META_TOTAL, porcentagem: 10});
	Session.setDefault('is_form_details_validate', false);
	Meteor.startup(function() {
		$('html').attr('lang', 'pt-BR');
	});

	Meteor.setInterval(function () {
		if (timer === 0) {
			timer = INITIAL_INTERVAL;
			Meteor.call('total_arrecadado', function(err, results) {
				let alcancado = results.data.available.amount;
				let waiting_funds = results.data.waiting_funds.amount;
				let porcentagem = (((META_TOTAL/100)*(alcancado+waiting_funds))*100);
				Session.set('progresso_meta', { 'alcancado': alcancado+waiting_funds, 'total': META_TOTAL, porcentagem: porcentagem});
			});
		} else {
			timer--;
		}
		Session.set('timer_atualizar_meta', timer);
	}, 1000)

	Template.meta_cozinheiro.helpers({
		timer_atualizar_meta: function () {
			return Session.get('timer_atualizar_meta');
		},
		progresso_meta: function () {
			return Session.get('progresso_meta');
		}
	});


	Template.doacao.helpers({
		plano_ativo: function () {
			return Session.get('plano_ativo');
		},
		is_outro_plano_visible: function () {
			return Session.get('is_outro_plano_visible');
		},
		is_form_details_validate: function () {
			return Session.get('is_form_details_validate');
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
		'click #voltar': function(evt) {
			Session.set('is_form_details_validate', false);
			return false;
		},
		'click #cancelar': function(evt) {
			trocar_plano(0);
			return false;
		},
		'click .plano': function(evt) {
			var plano_id = evt.target.id;
			trocar_plano(plano_id);
			return false;
		},
		'submit #dados_pessoais_apoiador': function (evt) {
			evt.preventDefault();

			TelefoneSchema = new SimpleSchema({
				ddd    : {type: String},
				number : {type: String}
			});
			EnderecoSchema = new SimpleSchema({
				street        : {type: String},
				neighborhood  : {type: String},
				zipcode       : {type: String},
				street_number : {type: String},
				complementary : {type: String}
			});
			DadosPessoaisSchema = new SimpleSchema({
				name            : {type: String, min: 1},
				document_number : {type: String},
				born_at         : {type: String},
				gender          : {type: String},
				email           : {type: String},
				address : {type: EnderecoSchema},
				phone : {type: TelefoneSchema}
			});


			var customer = {
				name            : evt.target.customer_name.value,
				document_number : evt.target.customer_document_number.value,
				born_at         : evt.target.customer_born_at.value,
				gender          : evt.target.customer_gender.value,
				email           : evt.target.customer_email.value,
				address : {
					street        : evt.target.customer_address_street.value,
					neighborhood  : evt.target.customer_address_neighborhood.value,
					zipcode       : evt.target.customer_address_zipcode.value,
					street_number : evt.target.customer_address_street_number.value,
					complementary : evt.target.customer_address_complementary.value
				},
				phone : {
					ddd    : evt.target.customer_phone_ddd.value,
					number : evt.target.customer_phone_number.value
				}
			};

			context = DadosPessoaisSchema.namedContext("myContext");
			isValid = context.validate(customer);

			if (!isValid) {
					console.log(context.invalidKeys());
			} else {
				Session.set('is_form_details_validate', 'valido');
			}
		},
		'submit #dados_pagamento_apoiador': function (evt) {
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
								className: 'alert success',
								text:'Assinatura realizada com sucesso.'
							});
						} else {
							var stringErrors = [];
							// console.log(results, err);
							// for (var field in results.errors) {
							// 	stringErrors.push(results.errors[field].message);
							// }
							Session.set('flash_message', {
								className: 'alert error',
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
	},
	'total_arrecadado': function() {
		return HTTP.call("GET", "https://api.pagar.me/1/balance", {data: {api_key: Meteor.settings.PagarMe.API_KEY}});
	}
});

  Meteor.startup(function () {
	// code to run on server at startup
  });
}
