if (Meteor.isClient) {
	Template.meta_cozinheiro.helpers({
		timer_atualizar_meta: function () {
			return Session.get('timer_atualizar_meta');
		},
		progresso_meta: function () {
			return Session.get('progresso_meta');
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
			return HTTP.call("GET", "https://api.pagar.me/1/payables", {data: {api_key: Meteor.settings.PagarMe.API_KEY}});
		}
	});

	Meteor.startup(function () {
	// code to run on server at startup
	});
}
