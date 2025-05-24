module mooncl::Mooncl;

use sui::coin::{Self, Coin,TreasuryCap};
use sui::dynamic_field as df;

public struct MOONCL has drop {}

public struct Registry has key {
  id: UID,
  total_supply: u64,
}

fun init(witness: MOONCL, ctx: &mut TxContext) {
  let (treasury, metadata) = coin::create_currency(
				witness,
				9,
				b"Mooncl",
				b"Mooncl",
				b"Mooncl Governance Token",
				option::none(),
				ctx,
		);
		transfer::public_freeze_object(metadata);
		transfer::public_transfer(treasury, ctx.sender());
    transfer::share_object(Registry{
      id: object::new(ctx), 
      total_supply: 0
    });
}

public entry fun mint_to<T>(cap: &mut TreasuryCap<T>, value: u64, target: address, 
registry: &mut Registry, ctx: &mut TxContext) {
    let mut coin_mint = coin::mint(cap, value, ctx);
    if(df::exists_(&registry.id, target)){
      let outCoin: Coin<T> = df::remove(&mut registry.id, target);
      coin::join<T>(&mut coin_mint, outCoin);
      df::add(&mut registry.id, target, coin_mint);
    }else{
      df::add(&mut registry.id, target, coin_mint);
    };
    assert!(registry.total_supply + value <= 1_000_000_000_000_000_000, 1);
    registry.total_supply = registry.total_supply + value;
}

public entry fun claim<T>(registry: &mut Registry, ctx: &mut TxContext){
  let coin: Coin<T> = df::remove(&mut registry.id, ctx.sender());
  transfer::public_transfer(coin, ctx.sender());
}

#[test_only]
public fun test_init(ctx: &mut TxContext){
  init(Mooncl {}, ctx);
}