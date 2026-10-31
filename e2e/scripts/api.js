// Maestro runScript helpers. The mock fails on purpose, so every call retries with the same key.
var BASE = "https://dev.zahln.de";
var CANDIDATE = "c_b948552f5f";

function call(method, path, token, body, key) {
  var headers = { "X-Candidate-Id": CANDIDATE, "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  if (key) headers["Idempotency-Key"] = key;
  if (method === "POST" && path.indexOf("/payments") > 0) headers["X-App-Version"] = "1.0.0";
  for (var attempt = 0; attempt < 8; attempt++) {
    var res = method === "GET"
      ? http.get(BASE + path, { headers: headers })
      : http.post(BASE + path, { headers: headers, body: JSON.stringify(body) });
    if (res.status >= 200 && res.status < 300) return json(res.body);
    if (res.status < 500 && res.status !== 0) throw new Error(method + " " + path + " → " + res.status + " " + res.body);
  }
  throw new Error(method + " " + path + " kept failing");
}

function login(username) {
  return call("POST", "/sessions", null, { username: username, password: "test1234" }).accessToken;
}

function newKey() {
  return "e2e-" + Date.now() + "-" + Math.floor(Math.random() * 1e9);
}

// ACTION picks what this run does; Maestro passes it with `env`.
if (ACTION === "pay_as") {
  var payerToken = login(PAYER);
  var order = call("GET", "/orders/" + ORDER_ID, payerToken);
  var payment = call("POST", "/orders/" + ORDER_ID + "/payments", payerToken, { amountCents: order.amountCents }, newKey());
  output.paymentId = payment.id;
  output.paidCents = order.amountCents;
} else {
  throw new Error("Unknown ACTION " + ACTION);
}
