describe ( "Convert Library ", function(){
	describe("Distance converter", function(){
		it("converts distance in feet to m",function(){
			expect(Convert(1,"ft").to("m")).toEqual(0.33);
		});
	});

	describe("Temp converter",function(){
		it("converts f to celcius",function(){
			expect(Convert(32,"F").to("C")).toEqual(0);
		});
		it("converts c to f",function(){
			expect(Convert(100,"C").to("F")).toEqual(212);
		});
	});

	it("throws an error when passed an unknown from-unit", function () {
	    var testFn = function () {
	        Convert(1, "dollar").to("yens");
	    }
	    expect(testFn).toThrow(new Error("unrecognized from-unit"));
	});
});