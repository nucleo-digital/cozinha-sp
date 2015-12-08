var timer = 0;
var INITIAL_INTERVAL = 60;
var META_TOTAL = 8.143,50;
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
		ddd    : '',
		number : ''
	}
});
Meteor.startup(function() {
	$('html').attr('lang', 'pt-BR');
});

Meteor.setInterval(function () {
	if (timer === 0) {
		timer = INITIAL_INTERVAL;
		Meteor.call('total_arrecadado', function(err, results) {
			var alcancado = 0;
			results.data.map(function(v) {
				alcancado = alcancado+v.amount-v.fee;
			})
			let porcentagem = ((META_TOTAL/100)*alcancado)/100;
			Session.set('progresso_meta', { 'alcancado': alcancado, 'total': META_TOTAL, porcentagem: porcentagem});
		});
	} else {
		timer--;
	}
	Session.set('timer_atualizar_meta', timer);
}, 1000)
