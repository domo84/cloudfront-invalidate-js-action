const fs = require("fs");
const AWS = require("aws-sdk");
const core = require("@actions/core");

// This is very vendor specific and should be abstracted away.
function parseContents(contents)
{
	const paths = JSON.parse(contents);
	const items = [
		...paths.stale.map(path => `/${path.key.replace("index.html", "")}`),
		...paths.purge.map(path => `/${path.key.replace("index.html", "")}`)
	];

	return items;
}

async function main() {
	const contents = fs.readFileSync("./" + core.getInput("file"));
	const items = parseContents(contents);
	if(items.length == 0) {
		console.log("0 files to validate", "Skipping..");
		return;
	}
	const params = {
		DistributionId: core.getInput("distribution_id"),
		InvalidationBatch: {
			CallerReference: "GITHUB-ACTION-" + Date.now(),
			Paths: {
				Quantity: items.length,
				Items: items
			}
		}
	};

	console.log("items", items);

	try {
		const cf = new AWS.CloudFront();
		const result = await cf.createInvalidation(params).promise();
		console.log("result", result);
	} catch(e) {
		console.error(e);
		core.setFailed(e.message);
	}
}

(async function() {
	try {
		await main();
	} catch(e) {
		console.error(e);
		core.setFailed(e.message);
	}
}());
