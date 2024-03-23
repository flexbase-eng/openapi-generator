local t = require "template"

-- Variables
var_a = 7
var_b = 19
name  = "John"
foods = { "Apple", "Pear", "Banana" }

-- Count "library"
count = {}
function count.get_a()
    return 4
end
function count.get_b()
    return 5
end

-- Some function
function adder(a, b)
    return a+b
end

-- Safe environmet to prevent templates
-- from doing things like running arbitary
-- commands with os.execute.
local env = {
    pairs  = pairs,
    ipairs = ipairs,
    type   = type,
    table  = table,
    string = string,
    date   = os.date,
    math   = math,
    adder  = adder,
    count  = count,
    var_a  = var_a,
    var_b  = var_b,
    name   = name,
    foods  = foods
}


print(t.compile_file("template.txt", env))