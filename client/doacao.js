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


    console.log(evt.target.customer_gender.value);

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
			console.log(customer);
			Session.set('dados_doacao', customer);
		}
	},
	'submit #dados_pagamento_apoiador': function (evt) {
		evt.preventDefault();
		PagarMe.encryption_key = Meteor.settings.public.encryption_key;
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
					console.log(err,results);
					if ( (typeof results !== undefined) && (results !== null) && (results.statusCode === 200) ) {
						Session.set('flash_message', {
							className: 'success',
							messages: [{text:'Assinatura realizada com sucesso.'}]
						});
					} else if (typeof results !== undefined)  {
						console.log(results.response.data.errors);


            var text = "";
            var errors = results.response.data.errors;
            for (var i = 0; i <= errors.length ; i++) {
              text += errors[i].message + "\n";
            }

						Session.set('flash_message', {
							className: 'error',
							messages: [{text: text }]
						});
					} else {
						console.log(err, results);
						Session.set('flash_message', {
							className: 'error',
							messages: [{text:'Falha ao tentar realizar a assinatura.'}]
						});
					}
				});
			});
		}
	}
});
