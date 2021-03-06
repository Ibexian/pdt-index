import React from 'react';
import { Table, Col, Row } from 'reactstrap'
import { compose, withStateHandlers, withPropsOnChange, withHandlers } from 'recompose';
import { chain, each, filter, includes } from 'lodash';
import CocktailRow from './CocktailRow';
import Card from './Card';
import IngredientsList from './IngredientsList';

const CocktailIndex = ({ ingredients, name, dirty, topFiveYield, onSaveChanges, recipes, have, filterIngredients, onSelectAllChange, setFilterIngredients, buyList, setSelected, search, setSearch, selected, ...props }) => {
  return (
    <Row>
      <Col xs={false} sm="4" md="3">
        <Card header="Ingredients" toggleKey="ingredients_toggle">
          <IngredientsList {...{ setSearch, search, filterIngredients, setFilterIngredients, onSaveChanges,
            dirty, onSelectAllChange, ingredients, setSelected, selected }} />
        </Card>
      </Col>
      <Col xs={false} sm="8" md="9">
        <Row>
          <Col xs={false} xl={true} className="mt-2 mt-sm-0">
            <Card toggleKey="cocktails_toggle" header={`${name} Cocktails`} subtitle={`You can make ${have} out of ${recipes.length} cocktails`}>
              <Table size="sm" striped>
                <thead>
                <tr>
                  <th>Name</th>
                  <th colSpan="2">Missing</th>
                </tr>
                </thead>
                <tbody>
                {recipes.map(i => (
                  <CocktailRow key={i.name} item={i} />
                ))}
                </tbody>

              </Table>
            </Card>
          </Col>
          <Col xs={false} xl={true} className="mt-2 mt-xl-0">
            <Card toggleKey="buylist_toggle" header="Buy List" subtitle={`Purchase the top 5 for an additional ${topFiveYield} cocktails`}>
              <Table size="sm" striped>
                <thead>
                <tr>
                  <th>Ingredient</th>
                  <th colSpan="2">Cocktails</th>
                </tr>
                </thead>
                <tbody>
                {buyList.map(i => (
                  <tr key={i.ingredient}>
                    <td>{i.ingredient}</td>
                    <td>{i.num}</td>
                    <td>{i.cocktails.join('; ')}</td>
                  </tr>
                ))}
                </tbody>
              </Table>
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}

const enhance = compose(
  withStateHandlers(({ saveKey }) => ({
    selected: JSON.parse(localStorage.getItem(saveKey) || '{}'),
    search: '',
    filterIngredients: null
  }), {
    setSelected: ({ selected }) => (ingredient, value) => ({
      selected: { ...selected, [ingredient]: value },
      dirty: true,
    }),
    setBulkSelected: () => (selected) => ({ selected, dirty: true }),
    setSearch: () => (search) => ({ search }),
    setFilterIngredients: () => (filterIngredients) => ({ filterIngredients }),
    onSaveChanges: ({ selected }, { saveKey }) => () => {
      localStorage.setItem(saveKey, JSON.stringify(selected));
      return { dirty: false };
    }
  }),
  withPropsOnChange(['selected'], ({ selected, recipes }) => {
    let nameIndex = 0;
    const list = chain(recipes)
      .sortBy('ingredient')
      .groupBy('name')
      .map((b, name) => {
        const missing = [];

        each(b, ({ ingredient }) => {
          if (!selected[ingredient]) {
            missing.push(ingredient);
          }
        });

        return {
          name: name,
          index: nameIndex++,
          page: b[0].page,
          numMissing: missing.length,
          missing,
          raw: b,
        };
      })
      .orderBy(['numMissing', 'name'])
      .value();

    const buyList = chain(list)
      .filter(i => i.numMissing === 1)
      .groupBy('missing')
      .map((i, key) => ({ ingredient: key, num: i.length, cocktails: chain(i).map('name').sortBy().value() }))
      .orderBy(['num', 'ingredient'], ['desc', 'asc']).value();

    return {
      recipes: list,
      buyList,
      have: filter(list, i => i.numMissing === 0).length,
      topFiveYield: chain(buyList).take(5).sumBy(i => i.cocktails.length)
    }
  }),
  withPropsOnChange(['search', 'filterIngredients'], ({ search, ingredients, filterIngredients, selected }) => {
    let copy = ingredients;

    if (search) {
      search = search.toLowerCase();
      copy = filter(copy, i => includes(i.name.toLowerCase(), search));
    }
    if (filterIngredients !== null) {
      copy = filter(copy, i => (filterIngredients ? selected[i.name] : !selected[i.name]));
    }

    return {
      ingredients: copy,
    }
  }),
  withHandlers({
    onSelectAllChange: ({ setBulkSelected, ingredients, selected }) => (value) => {
      const copy = {...selected};
      each(ingredients, i => {
        copy[i.name] = value;
      });
      setBulkSelected(copy);
    }
  })
)

export default enhance(CocktailIndex);
