**Input:** regular expressions described using strings.
E.g aab, a*b*, (ab)\*

**Objective:** parse regular expressions into NFAs using Thompson's construction.

**Supported grammar?:**

- (s)
- (st)
- (s|t)
- s\*
- s+
- s?
- ϵ

### Approach 1

parse regular expressions into a graph. a node represents a character or character and quantifier pair e.g a\*.

```ts
parseExpression(regex: string): number
```

It is recursively called on groups. It does a "rolling sum" of the characters, having only the sum node as the tail end of all the transitions from former characters until the character at the cursor.

#### Walkthrough

aab
a -> a -> b

a*b*
a*->b*

s
/
O
\
t

aa(s|t)\*

a -> gg
