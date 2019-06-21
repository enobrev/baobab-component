.PHONY : build production development watch clean

build: clean production

production:
	yarn run babel ./src --out-dir ./dist

development:
	yarn run babel ./src --source-maps --out-dir ./dist

watch:
	yarn run babel ./src --source-maps --watch --out-dir ./dist

clean:
	rm ./dist -Rf