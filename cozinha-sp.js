var timer = 0;
var INITIAL_INTERVAL = 60;
var META_TOTAL = 1000.00;
SimpleSchema.messages({
	required: "[label] é obrigatório",
	minString: "[label] deve conter pelo menos [min] caracteres",
	maxString: "[label] não pode ultrapassar [max] caracteres",
	minNumber: "[label] deve ser um número maior que [min]",
	maxNumber: "[label] deve ser um número menor que [max]",
	minDate: "[label] deve ser uma data maior que [min]",
	maxDate: "[label] deve ser uma data menor que [max]",
	badDate: "[label] não é uma data válida",
	minCount: "Você deve especificar ao menos [minCount] valores",
	maxCount: "Você não deve especificar mais que [maxCount] valores",
	noDecimal: "[label] deve ser um inteiro",
	notAllowed: "[value] não é um valor válido para [label]",
	expectedString: "[label] deve ser texto",
	expectedNumber: "[label] deve ser um número",
	expectedBoolean: "[label] deve ser um boolean",
	expectedArray: "[label] deve ser um array",
	expectedObject: "[label] deve ser um objeto",
	expectedConstructor: "[label] deve ser do tipo [type]",
	regEx: [
		{msg: "[label] failed regular expression validation"},
		{exp: SimpleSchema.RegEx.Email, msg: "[label] deve ser um endereço de e-mail válido"},
		{exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] deve ser um endereço de e-mail válido"},
		{exp: SimpleSchema.RegEx.Domain, msg: "[label] deve ser um domínio válido"},
		{exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] deve ser um domínio válido"},
		{exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
		{exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
		{exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
		{exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
		{exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"}
	],
	keyNotInSchema: "[key] não é permitido nesse schema"
});
if (Meteor.isClient) {
	Session.setDefault('card_hash', 0);
	Session.setDefault('flash_message', {});
	Session.setDefault('page_name', 'vazia');
	Session.setDefault('plano_ativo', 0);
	Session.setDefault('timer_atualizar_meta', INITIAL_INTERVAL);
	Session.setDefault('progresso_meta', { 'alcancado': 10.00, 'total': META_TOTAL, porcentagem: 10});
	Session.setDefault('is_form_details_validate', false);
	Session.setDefault('planos', [
		{name: 'minimo',   id: 21690,        valor: 'R$ 10.00', color: 'rgb(27, 102, 64)', active: false},
		{name: 'minimo-2', id: 21691,        valor: 'R$ 20.00', color: 'rgb(32, 63,  44)', active: false},
		{name: 'ideal',    id: 21692,        valor: 'R$ 30.00', color: 'rgb(53, 68,  142)', active: false},
		{name: 'ideal-2',  id: 21693,        valor: 'R$ 40.00', color: 'rgb(38, 53,  96)', active: false},
		{name: 'outro',    id: 'outro-valor', valor: 'escolha outro valor', color: 'rgb(103, 58, 142)', active: false}
	]);
	Session.setDefault('dados_doacao', {
		name            : '',
		document_number : '',
		born_at         : '',
		gender          : '',
		email           : '',
		address : {
			street        : '',
			neighborhood  : '',
			zipcode       : '',
			street_number : '',
			complementary : ''
		},
		phone : {
			ddd    : 0,
			number : 0
		}
	});
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
			return Session.get('planos');
		},
		flash_message: function () {
			return Session.get('flash_message');
		},
		dados_doacao: function () {
			return Session.get('dados_doacao');
		}
	});

	var ativar_plano = function (v) {
		let plano_id = Session.get('plano_ativo');
		if (v.id.toString() === plano_id) {
			v.active = true;
		} else {
			v.active = false;
		}
		return v;
	};

	var trocar_plano = function (plano_id) {
			let planos = Session.get('planos');
			Session.set('plano_ativo', plano_id);
			Session.set('flash_message', '');
			if (plano_id === 'outro-valor') { // ativa plano para planos maiores
				Session.set('is_outro_plano_visible', true);
				Session.set('is_form_details_validate', false);
			} else if (plano_id === '0') { // desativa área de planos
				Session.set('is_outro_plano_visible', false);
				Session.set('is_form_details_validate', false);
			} else if (_.isNumber(parseInt(plano_id))) { // ativa plano no array de planos
				Session.set('is_outro_plano_visible', false);
				Session.set('is_form_details_validate', false);
			}
			Session.set('planos', planos.map(ativar_plano));
	};

	Template.doacao.events({
		'click #voltar': function(evt) {
			Session.set('flash_message', '');
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
				ddd    : {type: Number, min: 2, label: 'DDD'},
				number : {type: Number, min: 8, label: 'Telefone'}
			});
			EnderecoSchema = new SimpleSchema({
				street        : {type: String, min: 0},
				neighborhood  : {type: String, min: 0},
				zipcode       : {type: Number, regEx: /^[0-9]{8}$/, label: 'CEP'},
				street_number : {type: Number, label: 'Número'},
				complementary : {type: String, label: 'Complemento'}
			});
			DadosPessoaisSchema = new SimpleSchema({
				name            : {type: String, min: 5, label: 'Nome'},
				email           : {type: String, regEx: SimpleSchema.RegEx.Email, label: 'E-mail'},
				document_number : {type: Number, min: 11, label: 'CPF'},
				born_at         : {type: Date, label: 'Data de nascimento'},
				gender          : {type: String, allowedValues: ['F', 'M'], label: 'Gênero'},
				address : {type: EnderecoSchema},
				phone : {type: TelefoneSchema}
			});


			var customer = {
				name            : evt.target.customer_name.value,
				document_number : parseInt(evt.target.customer_document_number.value),
				born_at         : new Date(evt.target.customer_born_at.value),
				gender          : evt.target.customer_gender.value,
				email           : evt.target.customer_email.value,
				address : {
					street        : evt.target.customer_address_street.value,
					neighborhood  : evt.target.customer_address_neighborhood.value,
					zipcode       : parseInt(evt.target.customer_address_zipcode.value),
					street_number : parseInt(evt.target.customer_address_street_number.value),
					complementary : evt.target.customer_address_complementary.value
				},
				phone : {
					ddd    : parseInt(evt.target.customer_phone_ddd.value),
					number : parseInt(evt.target.customer_phone_number.value)
				}
			};

			ctxt = DadosPessoaisSchema.namedContext("myContext");
			isValid = ctxt.validate(customer);

			if (!isValid) {
				var ik = ctxt.invalidKeys();
				ik = _.map(ik, function (o) {
					return _.extend({text: ctxt.keyErrorMessage(o.name)}, o);
				});
				Session.set('flash_message', {className: 'error', 'messages': ik});
			} else {
				Session.set('is_form_details_validate', 'valido');
				Session.set('flash_message', '');
				Session.set('dados_doacao', customer);
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
					stringErrors.push({text:fieldErrors[field]});
				}

				Session.set('flash_message', {
					className: 'error',
					messages: stringErrors
				});
			} else {
				// se não há erros, gera o card_hash...
				creditCard.generateHash(function(cardHash) {
					Session.set('card_hash', cardHash);
					var customer = Session.get('dados_doacao');
					var plan_id = Session.get('plano_ativo');
					Session.set('flash_message', {className: 'loading', messages: [{text: ''}]});
					Meteor.call('assinar_plano', plan_id, cardHash, customer, function(err, results) {
							console.log(results, err);
						if ( (typeof err === undefined) && (results.statusCode === 200) ) {
							Session.set('flash_message', {
								className: 'success',
								messages: [{text:'Assinatura realizada com sucesso.'}]
							});
						} else {
							Session.set('flash_message', {
								className: 'error',
								messages: [{text:'Falha ao tentar realizar a assinatura. ' + err.message}]
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
	'assinar_plano': function (plan_id, card_hash, customer) {
		return HTTP.call("POST", "https://api.pagar.me/1/subscriptions", {
				data: {
					'api_key': Meteor.settings.PagarMe.API_KEY,
					'plan_id': plan_id,
					'card_hash': card_hash,
					'customer': customer
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
