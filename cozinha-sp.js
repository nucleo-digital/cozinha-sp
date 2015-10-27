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
			var response = Async.runSync(function(done) {
				HTTP.call("POST", "https://api.pagar.me/1/subscriptions", {
						params: {
							api_key: Meteor.settings.PagarMe.API_KEY,
							plan_id: plan_id,
							card_hash: card_hash,
							'customer[name]': customer.name,
							'customer[email]': customer.email,
							'customer[document_number]': customer.document_number,
							'customer[born_at]': customer.born_at,
							'customer[gender]': customer.gender,
							'address[street]': customer.address.street,
							'address[neighborhood]': customer.address.neighborhood,
							'address[zipcode]': customer.address.zipcode,
							'address[street_number]': customer.address.street_number,
							'address[complementary]': customer.address.complementary,
							'phone[ddd]': customer.phone.ddd,
							'phone[number]': customer.phone.number
						}
				}, function (data) { done(null, data); });
			});

			return response.result;
		},
		'total_arrecadado': function() {
			return HTTP.call("GET", "https://api.pagar.me/1/payables", {params: {api_key: Meteor.settings.PagarMe.API_KEY}});
		}
	});

	Meteor.startup(function () {
	// code to run on server at startup
	});
}
