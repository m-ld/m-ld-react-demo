Query:

```json
{
  "@id": "ex:moby_dick",
  "text": "?"
}
```

Result:

```json
{
  "@id": "ex:moby_dick",
  "text": {
    "@type": "mld:TSeq",
    "@id": "ex:sksksksks",
    "value": "Call me Ishmael..."
  }
}
```

Someone writes: (m-ld's json-rql)

```json
{
  "@update": [
    {
      "@id": "ex:moby_dick",
      "text": {
        "@splice": [8, 7, "Bob"]
      }
    }
  ]
}
```

Readers get: (m-ld's json-rql)

```json
{
  "@delete": [],
  "@insert": [],
  "@update": [
    {
      "@id": "ex:moby_dick",
      "text": {
        "@splice": [8, 7, "Bob"]
      }
    }
  ]
}
```

Component:

```jsx
const Editor = () => {
  // const textVar = xql.useVar();
  // const textVar2 = xql.useVar();

  const data = xql.useQuery({
    "@id": "ex:moby_dick",
    text: {
      "@value": "?",
      "@splice": "?",
    },
  });

  useEffect(() => {
    const editor = FancyEditor.attachTo("#the-editor");
    return () => {
      editor.detach();
    };
  }, []);

  useEffect(() => {
    const subscription = data.text["@splice"].subscribe((splice) => {
      editor.doSplice(splice);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [data]);

  return <div id="the-editor" />;
};
```

Sketching useVar idea:

```jsx

```
