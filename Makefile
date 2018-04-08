.PHONY : build production development watch clean

build: clean production

production:
	babel ./src --out-dir ./dist

development:
	babel ./src --source-maps --out-dir ./dist

watch:
	babel ./src --source-maps --watch --out-dir ./dist

clean:
	rm ./dist -Rf